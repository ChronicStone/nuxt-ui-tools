import { keepPreviousData, useInfiniteQuery, useQueries, useQuery } from '@tanstack/vue-query'
import type { InfiniteData, QueryKey } from '@tanstack/vue-query'
import { computed, shallowRef, watch } from 'vue'
import type { ComputedRef } from 'vue'

import { isArray, isFunction, isNumber, isObject, isString } from '../../shared/utils/predicate'
import { QUERY_DEFAULTS } from '../constants/query-state'
import type {
  GenericObject,
  TableCursorPageResult,
  TableExternalState,
  TableFacetExecutionResult,
  TableFacetsContext,
  TableFacetResult,
  TableFacetRequestDescriptor,
  TableGlobalFacetDescriptor,
  TableInfiniteQueryDefinition,
  TableOffsetPageResult,
  TableQueryDefinition,
  TableRemoteFacetSource,
  TableSchemaView,
  TableSourceExecutionResult,
  TableSourceRequestContext,
  TableRefreshResult,
  TableRuntimeRecord,
} from '../types'
import {
  executeClientFacets,
  filterClientRows,
  flattenTableCursorPages,
  resolveTableGlobalFacetDescriptors,
  isTableCursorPageResult,
  paginateClientRows,
  resolveTableRowId,
  sortClientRows,
} from '../utils'
import type { UseTableStartupReturn } from './use-table-startup'
import type { useTableState } from './use-table-state'

export interface UseTableDataParams {
  schema: ComputedRef<TableSchemaView>
  state: ReturnType<typeof useTableState>
  startup: UseTableStartupReturn
}

export interface UseTableDataReturn {
  context: ReturnType<typeof useQueries>
  contextData: ComputedRef<TableRuntimeRecord>
  pageContext: ReturnType<typeof useQueries>
  pageContextData: ComputedRef<TableRuntimeRecord>
  facetsBaseContext: ComputedRef<{
    filters: TableSourceRequestContext['filters']
    search: TableSourceRequestContext['search']
    context: TableRuntimeRecord
  }>
  requestContext: ComputedRef<TableSourceRequestContext>
  searchParams: ComputedRef<TableSourceRequestContext>
  query: ReturnType<typeof useQuery>
  infiniteQuery: ReturnType<typeof useInfiniteQuery>
  rawData: ComputedRef<TableExternalState>
  data: ComputedRef<TableExternalState>
  selectableRows: ComputedRef<GenericObject[]>
  facets: ComputedRef<TableFacetExecutionResult<string>>
  error: ComputedRef<unknown>
  status: ComputedRef<{
    initialized: boolean
    phase: 'booting' | 'scheduled' | 'active'
    isBooting: boolean
    isPending: boolean
    isFetching: boolean
    isRefreshing: boolean
    isRevalidating: boolean
    isContextPending: boolean
    isContextFetching: boolean
    isDataPending: boolean
    isDataFetching: boolean
    isPageContextPending: boolean
    isPageContextFetching: boolean
  }>
  refreshContext: () => Promise<TableRefreshResult[]>
  refreshData: () => (
    ...args: Parameters<ReturnType<typeof useQuery>['refetch']>
  ) => Promise<TableRefreshResult>
  refreshPageContext: () => Promise<TableRefreshResult[]>
  updateRows: (rows: GenericObject[]) => void
}

interface CombinedQueryResult {
  key?: string
  data?: unknown
  error?: unknown
  isPending?: boolean
  isFetching?: boolean
  isSuccess?: boolean
  isRefetching?: boolean
  refetch: () => Promise<TableRefreshResult>
}

type TableRuntimeSourceResult =
  | GenericObject[]
  | TableSourceExecutionResult
  | TableOffsetPageResult
  | TableCursorPageResult

export function useTableData(params: UseTableDataParams): UseTableDataReturn {
  const contextItems = computed(() =>
    (params.schema.value.context ?? []).filter((item) => item?.condition?.() ?? true),
  )

  const context = useQueries({
    combine: (results) =>
      results.map((result, index) => ({
        key: contextItems.value[index]?.key,
        ...result,
      })),
    queries: () =>
      contextItems.value.map((item) =>
        withEnabled(item.query(), params.startup.isActive.value, {
          refetchOnWindowFocus: QUERY_DEFAULTS.refetchOnWindowFocus,
          staleTime: QUERY_DEFAULTS.staleTime.context,
        }),
      ),
  })

  // SAFETY: the `combine` callback above adds the optional key while preserving TanStack result fields.
  const contextResults = computed(() => context.value as CombinedQueryResult[])

  const contextData = computed(() =>
    contextResults.value.reduce<TableRuntimeRecord>((acc, item) => {
      if (!item.key) {
        return acc
      }

      return { ...acc, [item.key]: item.data }
    }, {}),
  )

  const isContextPending = computed(() =>
    contextResults.value.some((item) => Boolean(item.isPending)),
  )

  const isContextFetching = computed(() =>
    contextResults.value.some((item) => Boolean(item.isFetching)),
  )

  const isContextReady = computed(
    () =>
      !contextItems.value.length || contextResults.value.every((item) => Boolean(item.isSuccess)),
  )

  const requestPagination = computed(() => params.state.queryState.pagination.value)
  const requestSorting = computed(() =>
    params.state.queryState.sorting.value ? [params.state.queryState.sorting.value] : [],
  )
  const requestFilters = computed(() => params.state.resolvedFilterState.value)
  const requestSearch = computed(() => ({
    fields: params.schema.value.filters?.search?.fields ?? [],
    value: params.state.queryState.filters.value.search,
  }))
  const facetsBaseContext = computed<UseTableDataReturn['facetsBaseContext']['value']>(() => ({
    context: contextData.value,
    filters: requestFilters.value,
    search: requestSearch.value,
  }))
  const globalFacetDescriptors = computed<TableGlobalFacetDescriptor<string>[]>(() =>
    resolveTableGlobalFacetDescriptors(params.schema.value.filters?.ui ?? []),
  )
  const remoteSource = computed(() =>
    params.schema.value.source.mode === 'remote' ? params.schema.value.source : null,
  )
  const hasRemoteFacetQuery = computed(() => isRemoteFacetQuery(remoteSource.value?.facets))
  const usesEmbeddedRemoteFacets = computed(() => remoteSource.value?.facets === true)
  const facetsContextKey = computed(() => JSON.stringify(facetsBaseContext.value))
  const lastResolvedEmbeddedFacetsKey = shallowRef<string | null>(null)
  const requestContext = computed<TableSourceRequestContext>(() => ({
    context: contextData.value,
    facets:
      usesEmbeddedRemoteFacets.value &&
      globalFacetDescriptors.value.length > 0 &&
      facetsContextKey.value !== lastResolvedEmbeddedFacetsKey.value
        ? globalFacetDescriptors.value
        : undefined,
    filters: requestFilters.value,
    pagination: requestPagination.value,
    search: requestSearch.value,
    sorting: requestSorting.value,
  }))

  const searchParams = requestContext

  const dataStaleTime = computed(() => QUERY_DEFAULTS.staleTime.data)
  const isCursorPagination = computed(() => requestPagination.value.mode === 'cursor')

  const query = useQuery<TableRuntimeSourceResult, Error, TableRuntimeSourceResult, QueryKey>(
    computed(() => {
      const definition = resolveSourceDefinition({
        context: contextData.value,
        request: requestContext.value,
        source: params.schema.value.source,
      })

      if (isCursorPagination.value) {
        return disabledQueryDefinition('cursor')
      }

      return withEnabled(definition, params.startup.isActive.value && isContextReady.value, {
        placeholderData: keepPreviousData,
        refetchOnWindowFocus: QUERY_DEFAULTS.refetchOnWindowFocus,
        staleTime: dataStaleTime.value,
      })
    }),
  )
  const infiniteQuery = useInfiniteQuery<
    TableRuntimeSourceResult,
    Error,
    InfiniteData<TableRuntimeSourceResult, string | null>,
    QueryKey,
    string | null
  >(
    computed(() => {
      if (!isCursorPagination.value) {
        return disabledInfiniteQueryDefinition()
      }

      return withInfiniteEnabled(
        createCursorQueryDefinition({
          context: contextData.value,
          request: requestContext.value,
          revision: params.state.queryState.paginationRevision.value,
          source: params.schema.value.source,
        }),
        params.startup.isActive.value && isContextReady.value,
        {
          refetchOnWindowFocus: QUERY_DEFAULTS.refetchOnWindowFocus,
          staleTime: dataStaleTime.value,
        },
      )
    }),
  )
  const globalFacetsQuery = useQuery<TableFacetExecutionResult<string>>(
    computed(() => {
      const facetsSource = remoteSource.value?.facets

      if (
        !hasRemoteFacetQuery.value ||
        !isRemoteFacetQuery(facetsSource) ||
        !globalFacetDescriptors.value.length
      ) {
        return {
          enabled: false,
          queryFn: async (): Promise<TableFacetExecutionResult<string>> => ({ facets: [] }),
          queryKey: ['table-global-facets', 'disabled'],
        } satisfies TableQueryDefinition<TableFacetExecutionResult<string>> & {
          enabled: boolean
        }
      }

      const facetContext: Parameters<typeof facetsSource>[0] = {
        ...facetsBaseContext.value,
        facets: globalFacetDescriptors.value,
      }

      return withEnabled(
        facetsSource(facetContext),
        params.startup.isActive.value && isContextReady.value,
        {
          refetchOnWindowFocus: QUERY_DEFAULTS.refetchOnWindowFocus,
          staleTime: QUERY_DEFAULTS.staleTime.filterOptions,
        },
      )
    }),
  )

  const rawDataState = shallowRef<TableExternalState>({
    rowCount: 0,
    rows: [],
  })
  const cursorRowOverrides = shallowRef<Map<string, GenericObject>>(new Map())
  const embeddedFacetsState = shallowRef<TableFacetResult<string>[]>([])

  const cursorRawData = computed<TableExternalState>(() => {
    const flattened = flattenTableCursorPages({
      pages: infiniteQuery.data.value?.pages ?? [],
      rowKey: params.schema.value.rowKey,
    })
    if (!cursorRowOverrides.value.size) {
      return flattened
    }

    return {
      rowCount: flattened.rowCount,
      rows: mergeRowsByKey({
        currentRows: flattened.rows,
        nextRows: [...cursorRowOverrides.value.values()],
        rowKey: params.schema.value.rowKey,
      }),
    }
  })
  const rawData = computed<TableExternalState>(() =>
    isCursorPagination.value ? cursorRawData.value : rawDataState.value,
  )
  const clientFilteredRows = computed(() => {
    if (!params.startup.isActive.value) {
      return []
    }
    if (params.schema.value.source.mode !== 'client') {
      return rawData.value.rows
    }

    return filterClientRows({
      filters: requestFilters.value,
      rows: rawData.value.rows,
      search: requestSearch.value,
    })
  })
  const clientSortedRows = computed(() => {
    if (!params.startup.isActive.value) {
      return []
    }
    if (params.schema.value.source.mode !== 'client') {
      return clientFilteredRows.value
    }

    return sortClientRows({
      rows: clientFilteredRows.value,
      sorting: requestSorting.value,
    })
  })
  const data = computed<TableExternalState>(() => {
    if (!params.startup.isActive.value) {
      return {
        rowCount: 0,
        rows: [],
      }
    }

    if (params.schema.value.source.mode !== 'client') {
      return rawData.value
    }

    return paginateClientRows({
      pagination: requestPagination.value,
      rows: clientSortedRows.value,
    })
  })
  const selectableRows = computed<GenericObject[]>(() =>
    params.startup.isActive.value
      ? params.schema.value.source.mode === 'client'
        ? clientSortedRows.value
        : data.value.rows
      : [],
  )
  const clientFacetDescriptors = computed<TableFacetRequestDescriptor<string>[]>(() =>
    globalFacetDescriptors.value.map((facet) => ({
      key: facet.key,
      limit: facet.limit,
      mode: facet.mode,
    })),
  )
  const facets = computed<TableFacetExecutionResult<string>>(() => {
    if (!params.startup.isActive.value) {
      return { facets: [] }
    }
    if (params.schema.value.source.mode === 'client') {
      return executeClientFacets({
        facets: clientFacetDescriptors.value,
        request: requestContext.value,
        rows: rawData.value.rows,
      })
    }

    if (hasRemoteFacetQuery.value) {
      return globalFacetsQuery.data.value ?? { facets: [] }
    }

    if (usesEmbeddedRemoteFacets.value) {
      return { facets: embeddedFacetsState.value }
    }

    return { facets: [] }
  })

  const pageContextItems = computed(() =>
    (params.schema.value.pageContext ?? []).filter((item) => item?.condition?.() ?? true),
  )
  const isActiveDataSuccess = computed(() =>
    isCursorPagination.value ? infiniteQuery.isSuccess.value : query.isSuccess.value,
  )
  const isActiveDataFetching = computed(() =>
    isCursorPagination.value ? infiniteQuery.isFetching.value : query.isFetching.value,
  )
  const isActiveDataPending = computed(() =>
    isCursorPagination.value ? infiniteQuery.isPending.value : query.isPending.value,
  )
  const isActiveDataRefetching = computed(() =>
    isCursorPagination.value ? infiniteQuery.isRefetching.value : query.isRefetching.value,
  )
  const activeDataError = computed(() =>
    isCursorPagination.value ? infiniteQuery.error.value : query.error.value,
  )

  const isPageContextEnabled = computed(
    () =>
      params.startup.isActive.value &&
      isContextReady.value &&
      isActiveDataSuccess.value &&
      !isActiveDataFetching.value,
  )

  const pageContext = useQueries({
    combine: (results) =>
      results.map((result, index) => ({
        key: pageContextItems.value[index]?.key,
        ...result,
      })),
    queries: () => {
      if (!isPageContextEnabled.value) {
        return []
      }

      return pageContextItems.value.map((item) =>
        withEnabled(
          item.query({
            context: contextData.value,
            rows: data.value.rows,
          }),
          true,
          {
            refetchOnWindowFocus: QUERY_DEFAULTS.refetchOnWindowFocus,
            staleTime: QUERY_DEFAULTS.staleTime.context,
          },
        ),
      )
    },
  })

  // SAFETY: the `combine` callback above adds the optional key while preserving TanStack result fields.
  const pageContextResults = computed(() => pageContext.value as CombinedQueryResult[])

  const pageContextData = computed(() =>
    pageContextResults.value.reduce<TableRuntimeRecord>((acc, item) => {
      if (!item.key) {
        return acc
      }

      return { ...acc, [item.key]: item.data }
    }, {}),
  )

  const isPageContextPending = computed(
    () =>
      isPageContextEnabled.value &&
      pageContextResults.value.some((item) => Boolean(item.isPending)),
  )

  const isPageContextFetching = computed(() =>
    pageContextResults.value.some((item) => Boolean(item.isFetching)),
  )

  const initialized = computed(
    () =>
      isActiveDataSuccess.value &&
      (!pageContextItems.value.length ||
        pageContextResults.value.every((item) => Boolean(item.isSuccess))),
  )

  const error = computed(() => {
    const contextError = contextResults.value.find((item) => item.error)?.error
    if (contextError) {
      return contextError
    }

    if (activeDataError.value) {
      return activeDataError.value
    }

    return pageContextResults.value.find((item) => item.error)?.error
  })

  const status = computed(() => {
    if (!params.startup.isActive.value) {
      return {
        initialized: false,
        isBooting: true,
        isContextFetching: false,
        isContextPending: false,
        isDataFetching: false,
        isDataPending: false,
        isFetching: false,
        isPageContextFetching: false,
        isPageContextPending: false,
        isPending: true,
        isRefreshing: false,
        isRevalidating: false,
        phase: params.startup.phase.value,
      }
    }

    const isDataPending = isActiveDataPending.value
    const isDataFetching = isActiveDataFetching.value
    const isRefreshing =
      context.value.some((item) => Boolean(item.isRefetching)) ||
      isActiveDataRefetching.value ||
      pageContextResults.value.some((item) => Boolean(item.isRefetching))

    return {
      initialized: initialized.value,
      isBooting: false,
      isContextFetching: isContextFetching.value,
      isContextPending: isContextPending.value,
      isDataFetching,
      isDataPending,
      isFetching: isContextFetching.value || isDataFetching || isPageContextFetching.value,
      isPageContextFetching: isPageContextFetching.value,
      isPageContextPending: isPageContextPending.value,
      isPending:
        isContextPending.value ||
        (!isActiveDataSuccess.value && isDataPending) ||
        (!initialized.value && isPageContextPending.value),
      isRefreshing,
      isRevalidating: isActiveDataRefetching.value && rawData.value.rows.length > 0,
      phase: params.startup.phase.value,
    }
  })

  watch(
    () => query.data.value,
    (nextQueryData) => {
      const normalized = normalizeExternalState(nextQueryData)
      if (sameExternalState(rawDataState.value, normalized)) {
        return
      }

      rawDataState.value = normalized

      const embeddedFacets = extractEmbeddedFacets(nextQueryData)
      if (!embeddedFacets) {
        return
      }

      embeddedFacetsState.value = embeddedFacets
      lastResolvedEmbeddedFacetsKey.value = facetsContextKey.value
    },
    { immediate: true },
  )

  watch(
    () => infiniteQuery.data.value?.pages,
    (pages) => {
      if (!pages) {
        return
      }

      for (let index = pages.length - 1; index >= 0; index--) {
        const embeddedFacets = extractEmbeddedFacets(pages[index])
        if (!embeddedFacets) {
          continue
        }

        embeddedFacetsState.value = embeddedFacets
        lastResolvedEmbeddedFacetsKey.value = facetsContextKey.value
        return
      }
    },
    { immediate: true },
  )

  watch([requestContext, () => params.state.queryState.paginationRevision.value], () => {
    cursorRowOverrides.value = new Map()
  })

  async function refreshContext() {
    params.startup.start()
    return Promise.all(contextResults.value.map((item) => item.refetch()))
  }

  function refreshData() {
    return (...args: Parameters<typeof query.refetch>) => {
      params.startup.start()
      if (isCursorPagination.value) {
        cursorRowOverrides.value = new Map()
        return infiniteQuery.refetch(...args)
      }
      return query.refetch(...args)
    }
  }

  async function refreshPageContext() {
    params.startup.start()
    return Promise.all(pageContextResults.value.map((item) => item.refetch()))
  }

  function updateRows(rows: GenericObject[]) {
    if (!rows.length) {
      return
    }

    if (isCursorPagination.value) {
      const nextOverrides = new Map(cursorRowOverrides.value)
      for (const [index, row] of rows.entries()) {
        nextOverrides.set(
          resolveTableRowId({ index, row, rowKey: params.schema.value.rowKey }),
          row,
        )
      }
      cursorRowOverrides.value = nextOverrides
      return
    }

    const nextRawRows = mergeRowsByKey({
      currentRows: rawDataState.value.rows,
      nextRows: rows,
      rowKey: params.schema.value.rowKey,
    })

    if (sameRows(rawDataState.value.rows, nextRawRows)) {
      return
    }

    rawDataState.value = {
      rowCount: rawDataState.value.rowCount,
      rows: nextRawRows,
    }
  }

  return {
    context,
    contextData,
    data,
    error,
    facets,
    facetsBaseContext,
    infiniteQuery,
    pageContext,
    pageContextData,
    query,
    rawData,
    refreshContext,
    refreshData,
    refreshPageContext,
    requestContext,
    searchParams,
    selectableRows,
    status,
    updateRows,
  }
}

function normalizeExternalState<TValue>(result: TValue): TableExternalState {
  if (isArray(result)) {
    return {
      rowCount: result.length,
      rows: result,
    }
  }

  if (isTableExternalState(result)) {
    return {
      rowCount: result.rowCount,
      rows: result.rows,
    }
  }

  if (isTableOffsetPageResult(result)) {
    return {
      rowCount: result.pageInfo.rowCount,
      rows: result.rows,
    }
  }

  return {
    rowCount: 0,
    rows: [],
  }
}

function extractEmbeddedFacets<TValue>(result: TValue): TableFacetResult<string>[] | undefined {
  if (!isObject(result) || !('facets' in result)) {
    return undefined
  }

  const { facets } = result
  if (!isArray(facets)) {
    return undefined
  }

  return facets.filter(isTableFacetResult)
}

function isTableExternalState<TValue>(value: TValue): value is TValue & TableExternalState {
  if (!isObject(value)) {
    return false
  }
  if (!('rows' in value) || !('rowCount' in value)) {
    return false
  }

  return isArray(value.rows) && isNumber(value.rowCount)
}

function isTableOffsetPageResult<TValue>(value: TValue): value is TValue & TableOffsetPageResult {
  if (!isObject(value) || !('rows' in value) || !('pageInfo' in value)) {
    return false
  }
  if (!isArray(value.rows) || !isObject(value.pageInfo)) {
    return false
  }
  if (!('mode' in value.pageInfo) || value.pageInfo.mode !== 'offset') {
    return false
  }
  if (!('rowCount' in value.pageInfo)) {
    return false
  }

  return isNumber(value.pageInfo.rowCount)
}

function isTableFacetResult<TValue>(value: TValue): value is TValue & TableFacetResult<string> {
  return (
    isObject(value) &&
    'key' in value &&
    isStringKey(value.key) &&
    'options' in value &&
    isArray(value.options)
  )
}

function isStringKey<TValue>(value: TValue): value is TValue & string {
  return isString(value)
}

function sameExternalState(left: TableExternalState, right: TableExternalState) {
  return left.rowCount === right.rowCount && sameRows(left.rows, right.rows)
}

function sameRows(left: unknown[], right: unknown[]) {
  if (left === right) {
    return true
  }
  if (left.length !== right.length) {
    return false
  }

  for (let index = 0; index < left.length; index++) {
    if (left[index] !== right[index]) {
      return false
    }
  }

  return true
}

function mergeRowsByKey(options: {
  currentRows: GenericObject[]
  nextRows: GenericObject[]
  rowKey: TableSchemaView['rowKey']
}) {
  const replacements = new Map(
    options.nextRows.map((row, index) => [
      resolveTableRowId({ index, row, rowKey: options.rowKey }),
      row,
    ]),
  )

  return options.currentRows.map((row, index) => {
    const nextRow = replacements.get(resolveTableRowId({ index, row, rowKey: options.rowKey }))
    return nextRow ?? row
  })
}

function withEnabled<TData = unknown>(
  query: TableQueryDefinition<TData> & { enabled?: boolean },
  enabled: boolean,
  defaults?: {
    staleTime?: number
    refetchOnWindowFocus?: boolean
    placeholderData?: typeof keepPreviousData
  },
): TableQueryDefinition<TData> & { enabled: boolean; placeholderData?: typeof keepPreviousData } {
  return {
    ...query,
    ...defaults,
    enabled: enabled && query.enabled !== false,
  }
}

function isRemoteFacetQuery<
  TRow extends GenericObject,
  TContext extends GenericObject,
  TKey extends string,
>(
  value: TableRemoteFacetSource<TRow, TContext, TKey> | undefined,
): value is (
  context: TableFacetsContext<TRow, TContext, TKey>,
) => TableQueryDefinition<TableFacetExecutionResult<TKey>> {
  return isFunction(value)
}

function resolveSourceDefinition(options: {
  source: TableSchemaView['source']
  request: TableSourceRequestContext
  context: TableRuntimeRecord
}): TableQueryDefinition<TableRuntimeSourceResult> {
  return options.source.query({ ...options.request, context: options.context })
}

function createCursorQueryDefinition(options: {
  source: TableSchemaView['source']
  request: TableSourceRequestContext
  context: TableRuntimeRecord
  revision: number
}): TableInfiniteQueryDefinition<TableRuntimeSourceResult> {
  const firstPageDefinition = resolveSourceDefinition(options)
  const { pagination } = options.request
  if (pagination.mode !== 'cursor') {
    throw new Error('Cursor query definitions require cursor pagination.')
  }

  return {
    enabled: isQueryDefinitionEnabled(firstPageDefinition),
    getNextPageParam(lastPage) {
      return isTableCursorPageResult(lastPage)
        ? (lastPage.pageInfo.nextCursor ?? undefined)
        : undefined
    },
    initialPageParam: null,
    async queryFn(queryContext) {
      const definition = resolveSourceDefinition({
        ...options,
        request: {
          ...options.request,
          pagination: {
            count: pagination.count,
            cursor: queryContext.pageParam,
            mode: 'cursor',
            pageSize: pagination.pageSize,
          },
        },
      })

      if (!definition.queryFn) {
        throw new Error('Cursor table sources must provide a queryFn.')
      }
      return definition.queryFn(queryContext)
    },
    queryKey: [...firstPageDefinition.queryKey, { tableCursorRevision: options.revision }],
  }
}

function isQueryDefinitionEnabled(query: TableQueryDefinition<TableRuntimeSourceResult>) {
  if (!('enabled' in query)) {
    return true
  }
  return query.enabled !== false
}

function disabledQueryDefinition(reason: string) {
  return {
    enabled: false,
    queryFn: async () => [],
    queryKey: ['table-data-disabled', reason],
  } satisfies TableQueryDefinition<TableRuntimeSourceResult> & { enabled: false }
}

function disabledInfiniteQueryDefinition() {
  return {
    enabled: false,
    getNextPageParam: () => null,
    initialPageParam: null,
    queryFn: async () => [],
    queryKey: ['table-infinite-data-disabled'],
  } satisfies TableInfiniteQueryDefinition<TableRuntimeSourceResult> & { enabled: false }
}

function withInfiniteEnabled<TData = unknown>(
  query: TableInfiniteQueryDefinition<TData>,
  enabled: boolean,
  defaults?: { staleTime?: number; refetchOnWindowFocus?: boolean },
): TableInfiniteQueryDefinition<TData> & { enabled: boolean } {
  return {
    ...query,
    ...defaults,
    enabled: enabled && query.enabled !== false,
  }
}
