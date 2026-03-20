import { useQueries, useQuery } from '@tanstack/vue-query'
import { computed, shallowRef, watch, type ComputedRef } from 'vue'

import { QUERY_DEFAULTS } from '../constants/query-state'
import type {
  GenericObject,
  TableExternalState,
  TableQueryDefinition,
  TableSchemaView,
  TableSourceRequestContext,
} from '../types'
import { executeClientQuery } from '../utils'
import type { useTableState } from './use-table-state'

export interface UseTableDataParams {
  schema: ComputedRef<TableSchemaView>
  state: ReturnType<typeof useTableState>
}

export interface UseTableDataReturn {
  context: ReturnType<typeof useQueries>
  contextData: ComputedRef<GenericObject>
  pageContext: ReturnType<typeof useQueries>
  pageContextData: ComputedRef<GenericObject>
  requestContext: ComputedRef<TableSourceRequestContext>
  searchParams: ComputedRef<TableSourceRequestContext>
  query: ReturnType<typeof useQuery>
  rawData: ComputedRef<TableExternalState>
  data: ComputedRef<TableExternalState>
  error: ComputedRef<unknown>
  status: ComputedRef<{
    initialized: boolean
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
  refreshData: () => ReturnType<typeof useQuery>['refetch']
  refreshPageContext: () => Promise<unknown[]>
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

let clientQueryInstanceId = 0

export function useTableData(params: UseTableDataParams): UseTableDataReturn {
  const localClientQueryInstanceId = ++clientQueryInstanceId
  const contextItems = computed(() =>
    (params.schema.value.context ?? []).filter((item) => item?.condition?.() ?? true),
  )

  const context = useQueries({
    queries: () =>
      contextItems.value.map((item) =>
        withEnabled(item.query(), true, {
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
    contextResults.value.reduce<GenericObject>((acc, item) => {
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

  const requestContext = computed<TableSourceRequestContext>(() => ({
    context: contextData.value as TableSourceRequestContext['context'],
    pagination: params.state.queryState.pagination.value,
    sorting: params.state.queryState.sorting.value ? [params.state.queryState.sorting.value] : [],
    filters: params.state.resolvedFilterState.value,
    search: {
      value: params.state.queryState.filters.value.search,
      fields: params.schema.value.filters?.search?.fields ?? [],
    },
  }))

  const searchParams = requestContext

  const dataStaleTime = computed(() =>
    params.schema.value.source.mode === 'remote' ? QUERY_DEFAULTS.staleTime.data : 0,
  )

  const query = useQuery(
    computed(() =>
      withEnabled(
        scopeClientQueryDefinition(
          params.schema.value.source.query(
            requestContext.value as never,
          ) as TableQueryDefinition,
          {
            mode: params.schema.value.source.mode,
            instanceId: localClientQueryInstanceId,
          },
        ),
        isContextReady.value,
        {
          staleTime: dataStaleTime.value,
          refetchOnWindowFocus: QUERY_DEFAULTS.refetchOnWindowFocus,
        },
      ),
    ),
  )

  const rawDataState = shallowRef<TableExternalState>({
    rows: [],
    rowCount: 0,
  })

  const dataState = shallowRef<TableExternalState>({
    rows: [],
    rowCount: 0,
  })

  const rawData = computed<TableExternalState>(() => rawDataState.value)

  const data = computed<TableExternalState>(() => dataState.value)

  const pageContextItems = computed(() =>
    (params.schema.value.pageContext ?? []).filter((item) => item?.condition?.() ?? true),
  )

  const isPageContextEnabled = computed(
    () => isContextReady.value && query.isSuccess.value && !query.isFetching.value,
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
    pageContextResults.value.reduce<GenericObject>((acc, item) => {
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
      query.isSuccess.value &&
      (!pageContextItems.value.length ||
        pageContextResults.value.every((item) => Boolean(item.isSuccess))),
  )

  const error = computed(() => {
    const contextError = contextResults.value.find((item) => item.error)?.error
    if (contextError) {
      return contextError
    }

    if (query.error.value) {
      return query.error.value
    }

    return pageContextResults.value.find((item) => item.error)?.error
  })

  const status = computed(() => {
    const isDataPending = query.isPending.value
    const isDataFetching = query.isFetching.value
    const isRefreshing =
      context.value.some((item) => Boolean(item.isRefetching)) ||
      query.isRefetching.value ||
      pageContextResults.value.some((item) => Boolean(item.isRefetching))

    return {
      initialized: initialized.value,
      isPending:
        isContextPending.value ||
        (!query.isSuccess.value && isDataPending) ||
        (!initialized.value && isPageContextPending.value),
      isFetching: isContextFetching.value || isDataFetching || isPageContextFetching.value,
      isRefreshing,
      isRevalidating: query.isRefetching.value && rawData.value.rows.length > 0,
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
    },
    { immediate: true },
  )

  watch(
    () => ({
      mode: params.schema.value.source.mode,
      rawRows: rawData.value.rows,
      pageIndex: requestContext.value.pagination.pageIndex,
      pageSize: requestContext.value.pagination.pageSize,
      sorting: requestContext.value.sorting,
      filters: requestContext.value.filters,
      searchValue: requestContext.value.search.value,
      searchFields: requestContext.value.search.fields,
    }),
    (next) => {
      const resolved = next.mode === 'client'
        ? executeClientQuery({
            rows: next.rawRows,
            request: requestContext.value,
          })
        : rawData.value

      if (sameExternalState(dataState.value, resolved)) return
      dataState.value = resolved
    },
    { immediate: true },
  )

  async function refreshContext() {
    return Promise.all(contextResults.value.map((item) => item.refetch()))
  }

  function refreshData() {
    return query.refetch
  }

  async function refreshPageContext() {
    return Promise.all(pageContextResults.value.map((item) => item.refetch()))
  }

  return {
    context,
    contextData,
    pageContext,
    pageContextData,
    requestContext,
    searchParams,
    query,
    rawData,
    data,
    error,
    status,
    refreshContext,
    refreshData,
    refreshPageContext,
  }
}

function scopeClientQueryDefinition<TData>(
  query: TableQueryDefinition<TData>,
  options: {
    mode: TableSchemaView['source']['mode']
    instanceId: number
  },
) {
  if (options.mode !== 'client') return query

  return {
    ...query,
    queryKey: [...query.queryKey, `client-instance:${options.instanceId}`],
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
