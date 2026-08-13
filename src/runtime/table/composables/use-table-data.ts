import {
  useInfiniteQuery,
  useQueries,
  useQuery,
  type InfiniteData,
  type QueryKey,
} from '@tanstack/vue-query'
import { computed, shallowRef, watch, type ComputedRef } from 'vue'

import { QUERY_DEFAULTS } from '../constants/query-state'
import type {
  GenericObject,
  TableCursorPageResult,
  TableExternalState,
  TableFacetExecutionResult,
  TableFacetResult,
  TableFacetRequestDescriptor,
  TableGlobalFacetDescriptor,
  TableInfiniteQueryDefinition,
  TableQueryDefinition,
  TableSchemaView,
  TableSourceExecutionResult,
  TableSourceRequestContext,
} from '../types'
import {
  executeClientFacets,
  filterClientRows,
  flattenTableCursorPages,
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
  contextData: ComputedRef<Record<string, unknown>>
  pageContext: ReturnType<typeof useQueries>
  pageContextData: ComputedRef<Record<string, unknown>>
  facetsBaseContext: ComputedRef<{
    filters: TableSourceRequestContext['filters']
    search: TableSourceRequestContext['search']
    context: Record<string, unknown>
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
  refreshContext: () => Promise<unknown[]>
  refreshData: () => (
    ...args: Parameters<ReturnType<typeof useQuery>['refetch']>
  ) => Promise<unknown>
  refreshPageContext: () => Promise<unknown[]>
  updateRows: (rows: GenericObject[]) => void
}

type CombinedQueryResult = {
  key?: string
  data?: unknown
  error?: unknown
  isPending?: boolean
  isFetching?: boolean
  isSuccess?: boolean
  isRefetching?: boolean
  refetch: () => Promise<unknown>
}

type TableRuntimeSourceResult = GenericObject[] | TableSourceExecutionResult | TableCursorPageResult

export function useTableData(params: UseTableDataParams): UseTableDataReturn {
  const contextItems = computed(() =>
    (params.schema.value.context ?? []).filter((item) => item?.condition?.() ?? true),
  )

  const context = useQueries({
    queries: () =>
      contextItems.value.map((item) =>
        withEnabled(item.query(), params.startup.isActive.value, {
          staleTime: QUERY_DEFAULTS.staleTime.context,
          refetchOnWindowFocus: QUERY_DEFAULTS.refetchOnWindowFocus,
        }),
      ),
    combine: (results) =>
      results.map((result, index) => ({
        key: contextItems.value[index]?.key,
        ...result,
      })),
  })

  const contextResults = computed(() => context.value as CombinedQueryResult[])

  const contextData = computed(() =>
    contextResults.value.reduce<Record<string, unknown>>((acc, item) => {
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
    value: params.state.queryState.filters.value.search,
    fields: params.schema.value.filters?.search?.fields ?? [],
  }))
  const facetsBaseContext = computed<UseTableDataReturn['facetsBaseContext']['value']>(() => ({
    filters: requestFilters.value,
    search: requestSearch.value,
    context: contextData.value,
  }))
  const globalFacetDescriptors = computed<TableGlobalFacetDescriptor<string>[]>(() =>
    (params.schema.value.filters?.ui ?? []).flatMap((definition) => {
      if (definition.kind !== 'option' && definition.kind !== 'boolean') return []

      const descriptor = toGlobalFacetDescriptor({
        key: definition.key,
        facet: definition.source?.facet,
      })

      return descriptor ? [descriptor] : []
    }),
  )
  const remoteSource = computed(() =>
    params.schema.value.source.mode === 'remote' ? params.schema.value.source : null,
  )
  const hasRemoteFacetQuery = computed(() => typeof remoteSource.value?.facets === 'function')
  const usesEmbeddedRemoteFacets = computed(() => remoteSource.value?.facets === true)
  const facetsContextKey = computed(() => JSON.stringify(facetsBaseContext.value))
  const lastResolvedEmbeddedFacetsKey = shallowRef<string | null>(null)
  const requestContext = computed<TableSourceRequestContext>(() => ({
    context: contextData.value as TableSourceRequestContext['context'],
    pagination: requestPagination.value,
    sorting: requestSorting.value,
    filters: requestFilters.value,
    search: requestSearch.value,
    facets:
      usesEmbeddedRemoteFacets.value &&
      globalFacetDescriptors.value.length > 0 &&
      facetsContextKey.value !== lastResolvedEmbeddedFacetsKey.value
        ? globalFacetDescriptors.value
        : undefined,
  }))

  const searchParams = requestContext

  const dataStaleTime = computed(() => QUERY_DEFAULTS.staleTime.data)
  const isCursorPagination = computed(() => requestPagination.value.mode === 'cursor')

  const query = useQuery<TableRuntimeSourceResult, Error, TableRuntimeSourceResult, QueryKey>(
    computed(() => {
      const definition = resolveSourceDefinition({
        source: params.schema.value.source,
        request: requestContext.value,
        context: contextData.value,
      })

      if (isCursorPagination.value) return disabledQueryDefinition('cursor')

      return withEnabled(definition, params.startup.isActive.value && isContextReady.value, {
        staleTime: dataStaleTime.value,
        refetchOnWindowFocus: QUERY_DEFAULTS.refetchOnWindowFocus,
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
      if (!isCursorPagination.value) return disabledInfiniteQueryDefinition()

      return withInfiniteEnabled(
        createCursorQueryDefinition({
          source: params.schema.value.source,
          request: requestContext.value,
          context: contextData.value,
          revision: params.state.queryState.paginationRevision.value,
        }),
        params.startup.isActive.value && isContextReady.value,
        {
          staleTime: dataStaleTime.value,
          refetchOnWindowFocus: QUERY_DEFAULTS.refetchOnWindowFocus,
        },
      )
    }),
  )
  const globalFacetsQuery = useQuery<TableFacetExecutionResult<string>>(
    computed(() => {
      const facetsSource = remoteSource.value?.facets

      if (
        !hasRemoteFacetQuery.value ||
        typeof facetsSource !== 'function' ||
        !globalFacetDescriptors.value.length
      ) {
        return {
          queryKey: ['table-global-facets', 'disabled'],
          queryFn: async () => ({ facets: [] }) as TableFacetExecutionResult<string>,
          enabled: false,
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
          staleTime: QUERY_DEFAULTS.staleTime.filterOptions,
          refetchOnWindowFocus: QUERY_DEFAULTS.refetchOnWindowFocus,
        },
      )
    }),
  )

  const rawDataState = shallowRef<TableExternalState>({
    rows: [],
    rowCount: 0,
  })
  const cursorRowOverrides = shallowRef<Map<string, GenericObject>>(new Map())
  const embeddedFacetsState = shallowRef<TableFacetResult<string>[]>([])

  const cursorRawData = computed<TableExternalState>(() => {
    const flattened = flattenTableCursorPages({
      pages: infiniteQuery.data.value?.pages ?? [],
      rowKey: params.schema.value.rowKey,
    })
    if (!cursorRowOverrides.value.size) return flattened

    return {
      rows: mergeRowsByKey({
        currentRows: flattened.rows,
        nextRows: [...cursorRowOverrides.value.values()],
        rowKey: params.schema.value.rowKey,
      }),
      rowCount: flattened.rowCount,
    }
  })
  const rawData = computed<TableExternalState>(() =>
    isCursorPagination.value ? cursorRawData.value : rawDataState.value,
  )
  const clientFilteredRows = computed(() => {
    if (!params.startup.isActive.value) return []
    if (params.schema.value.source.mode !== 'client') return rawData.value.rows

    return filterClientRows({
      rows: rawData.value.rows,
      filters: requestFilters.value,
      search: requestSearch.value,
    })
  })
  const clientSortedRows = computed(() => {
    if (!params.startup.isActive.value) return []
    if (params.schema.value.source.mode !== 'client') return clientFilteredRows.value

    return sortClientRows({
      rows: clientFilteredRows.value,
      sorting: requestSorting.value,
    })
  })
  const data = computed<TableExternalState>(() => {
    if (!params.startup.isActive.value)
      return {
        rows: [],
        rowCount: 0,
      }

    if (params.schema.value.source.mode !== 'client') return rawData.value

    return paginateClientRows({
      rows: clientSortedRows.value,
      pagination: requestPagination.value,
    })
  })
  const selectableRows = computed<GenericObject[]>(() =>
    !params.startup.isActive.value
      ? []
      : params.schema.value.source.mode === 'client'
        ? clientSortedRows.value
        : data.value.rows,
  )
  const clientFacetDescriptors = computed<TableFacetRequestDescriptor<string>[]>(() =>
    globalFacetDescriptors.value.map((facet) => ({
      key: facet.key,
      mode: facet.mode,
      limit: facet.limit,
    })),
  )
  const facets = computed<TableFacetExecutionResult<string>>(() => {
    if (!params.startup.isActive.value) return { facets: [] }
    if (params.schema.value.source.mode === 'client')
      return executeClientFacets({
        rows: rawData.value.rows,
        request: requestContext.value,
        facets: clientFacetDescriptors.value,
      })

    if (hasRemoteFacetQuery.value) return globalFacetsQuery.data.value ?? { facets: [] }

    if (usesEmbeddedRemoteFacets.value) return { facets: embeddedFacetsState.value }

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
    queries: () => {
      if (!isPageContextEnabled.value) {
        return []
      }

      return pageContextItems.value.map((item) =>
        withEnabled(
          item.query({
            rows: data.value.rows,
            context: contextData.value as never,
          }),
          true,
          {
            staleTime: QUERY_DEFAULTS.staleTime.context,
            refetchOnWindowFocus: QUERY_DEFAULTS.refetchOnWindowFocus,
          },
        ),
      )
    },
    combine: (results) =>
      results.map((result, index) => ({
        key: pageContextItems.value[index]?.key,
        ...result,
      })),
  })

  const pageContextResults = computed(() => pageContext.value as CombinedQueryResult[])

  const pageContextData = computed(() =>
    pageContextResults.value.reduce<Record<string, unknown>>((acc, item) => {
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
        phase: params.startup.phase.value,
        isBooting: true,
        isPending: true,
        isFetching: false,
        isRefreshing: false,
        isRevalidating: false,
        isContextPending: false,
        isContextFetching: false,
        isDataPending: false,
        isDataFetching: false,
        isPageContextPending: false,
        isPageContextFetching: false,
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
      phase: params.startup.phase.value,
      isBooting: false,
      isPending:
        isContextPending.value ||
        (!isActiveDataSuccess.value && isDataPending) ||
        (!initialized.value && isPageContextPending.value),
      isFetching: isContextFetching.value || isDataFetching || isPageContextFetching.value,
      isRefreshing,
      isRevalidating: isActiveDataRefetching.value && rawData.value.rows.length > 0,
      isContextPending: isContextPending.value,
      isContextFetching: isContextFetching.value,
      isDataPending,
      isDataFetching,
      isPageContextPending: isPageContextPending.value,
      isPageContextFetching: isPageContextFetching.value,
    }
  })

  watch(
    () => query.data.value,
    (nextQueryData) => {
      const normalized = normalizeExternalState(nextQueryData)
      if (sameExternalState(rawDataState.value, normalized)) return

      rawDataState.value = normalized

      const embeddedFacets = extractEmbeddedFacets(nextQueryData)
      if (!embeddedFacets) return

      embeddedFacetsState.value = embeddedFacets
      lastResolvedEmbeddedFacetsKey.value = facetsContextKey.value
    },
    { immediate: true },
  )

  watch(
    () => infiniteQuery.data.value?.pages,
    (pages) => {
      if (!pages) return

      for (let index = pages.length - 1; index >= 0; index--) {
        const embeddedFacets = extractEmbeddedFacets(pages[index])
        if (!embeddedFacets) continue

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
    if (!rows.length) return

    if (isCursorPagination.value) {
      const nextOverrides = new Map(cursorRowOverrides.value)
      for (const [index, row] of rows.entries())
        nextOverrides.set(
          resolveTableRowId({ rowKey: params.schema.value.rowKey, row, index }),
          row,
        )
      cursorRowOverrides.value = nextOverrides
      return
    }

    const nextRawRows = mergeRowsByKey({
      currentRows: rawDataState.value.rows,
      nextRows: rows,
      rowKey: params.schema.value.rowKey,
    })

    if (sameRows(rawDataState.value.rows, nextRawRows)) return

    rawDataState.value = {
      rows: nextRawRows,
      rowCount: rawDataState.value.rowCount,
    }
  }

  return {
    context,
    contextData,
    pageContext,
    pageContextData,
    facetsBaseContext,
    requestContext,
    searchParams,
    query,
    infiniteQuery,
    rawData,
    data,
    selectableRows,
    facets,
    error,
    status,
    refreshContext,
    refreshData,
    refreshPageContext,
    updateRows,
  }
}

function normalizeExternalState(result: unknown): TableExternalState {
  if (Array.isArray(result)) {
    return {
      rows: result,
      rowCount: result.length,
    }
  }

  if (isTableExternalState(result)) {
    return {
      rows: result.rows,
      rowCount: result.rowCount,
    }
  }

  return {
    rows: [],
    rowCount: 0,
  }
}

function extractEmbeddedFacets(result: unknown): TableFacetResult<string>[] | undefined {
  if (!result || typeof result !== 'object' || !('facets' in result)) return undefined

  const { facets } = result as { facets?: unknown }
  if (!Array.isArray(facets)) return undefined

  return facets as TableFacetResult<string>[]
}

function toGlobalFacetDescriptor(options: {
  key: string
  facet: GlobalFacetSpec | undefined
}): TableGlobalFacetDescriptor<string> | null {
  if (!options.facet) return null
  if (hasPerFilterFacetQuery(options.facet)) return null

  return {
    key: options.key,
    mode: resolveFacetMode(options.facet),
    limit: typeof options.facet === 'object' ? options.facet.limit : undefined,
  }
}

function hasPerFilterFacetQuery(facet: GlobalFacetSpec) {
  return typeof facet === 'object' && typeof facet.query === 'function'
}

function resolveFacetMode(facet: GlobalFacetSpec): 'exclude-self' | 'include-self' {
  if (facet === 'include-self') return 'include-self'
  if (typeof facet === 'object' && facet.mode === 'include-self') return 'include-self'
  return 'exclude-self'
}

type GlobalFacetSpec =
  | boolean
  | 'exclude-self'
  | 'include-self'
  | {
      mode?: 'exclude-self' | 'include-self'
      limit?: number
      query?: unknown
    }

function isTableExternalState(value: unknown): value is TableExternalState {
  if (!value || typeof value !== 'object') return false
  if (!('rows' in value) || !('rowCount' in value)) return false

  return Array.isArray(value.rows) && typeof value.rowCount === 'number'
}

function sameExternalState(left: TableExternalState, right: TableExternalState) {
  return left.rowCount === right.rowCount && sameRows(left.rows, right.rows)
}

function sameRows(left: unknown[], right: unknown[]) {
  if (left === right) return true
  if (left.length !== right.length) return false

  for (let index = 0; index < left.length; index++) {
    if (left[index] !== right[index]) return false
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
      resolveTableRowId({ rowKey: options.rowKey, row, index }),
      row,
    ]),
  )

  return options.currentRows.map((row, index) => {
    const nextRow = replacements.get(resolveTableRowId({ rowKey: options.rowKey, row, index }))
    return nextRow ?? row
  })
}

function withEnabled<TData = unknown>(
  query: TableQueryDefinition<TData>,
  enabled: boolean,
  defaults?: { staleTime?: number; refetchOnWindowFocus?: boolean },
): TableQueryDefinition<TData> & { enabled: boolean } {
  return {
    ...query,
    ...(defaults ?? {}),
    enabled: enabled && (query as { enabled?: boolean }).enabled !== false,
  } as TableQueryDefinition<TData> & { enabled: boolean }
}

function resolveSourceDefinition(options: {
  source: TableSchemaView['source']
  request: TableSourceRequestContext
  context: Record<string, unknown>
}): TableQueryDefinition<TableRuntimeSourceResult> {
  return options.source.query({ ...options.request, context: options.context })
}

function createCursorQueryDefinition(options: {
  source: TableSchemaView['source']
  request: TableSourceRequestContext
  context: Record<string, unknown>
  revision: number
}): TableInfiniteQueryDefinition<TableRuntimeSourceResult> {
  const firstPageDefinition = resolveSourceDefinition(options)
  const pagination = options.request.pagination
  if (pagination.mode !== 'cursor')
    throw new Error('Cursor query definitions require cursor pagination.')

  return {
    queryKey: [...firstPageDefinition.queryKey, { tableCursorRevision: options.revision }],
    initialPageParam: null,
    async queryFn(queryContext) {
      const definition = resolveSourceDefinition({
        ...options,
        request: {
          ...options.request,
          pagination: {
            mode: 'cursor',
            cursor: queryContext.pageParam,
            pageSize: pagination.pageSize,
            count: pagination.count,
          },
        },
      })

      if (!definition.queryFn) throw new Error('Cursor table sources must provide a queryFn.')
      return definition.queryFn(queryContext)
    },
    getNextPageParam(lastPage) {
      return isTableCursorPageResult(lastPage)
        ? (lastPage.pageInfo.nextCursor ?? undefined)
        : undefined
    },
    enabled: isQueryDefinitionEnabled(firstPageDefinition),
  }
}

function isQueryDefinitionEnabled(query: TableQueryDefinition<TableRuntimeSourceResult>) {
  if (!('enabled' in query)) return true
  return query.enabled !== false
}

function disabledQueryDefinition(reason: string) {
  return {
    queryKey: ['table-data-disabled', reason],
    queryFn: async () => [],
    enabled: false,
  } satisfies TableQueryDefinition<TableRuntimeSourceResult> & { enabled: false }
}

function disabledInfiniteQueryDefinition() {
  return {
    queryKey: ['table-infinite-data-disabled'],
    queryFn: async () => [],
    initialPageParam: null,
    getNextPageParam: () => undefined,
    enabled: false,
  } satisfies TableInfiniteQueryDefinition<TableRuntimeSourceResult> & { enabled: false }
}

function withInfiniteEnabled<TData = unknown>(
  query: TableInfiniteQueryDefinition<TData>,
  enabled: boolean,
  defaults?: { staleTime?: number; refetchOnWindowFocus?: boolean },
): TableInfiniteQueryDefinition<TData> & { enabled: boolean } {
  return {
    ...query,
    ...(defaults ?? {}),
    enabled: enabled && query.enabled !== false,
  }
}
