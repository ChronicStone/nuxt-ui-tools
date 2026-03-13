import { computed, type ComputedRef } from 'vue'
import { useQueries, useQuery } from '@tanstack/vue-query'

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

export function useTableData(
  params: UseTableDataParams,
): UseTableDataReturn {
  const contextItems = computed(() =>
    (params.schema.value.context ?? []).filter((item) => item?.condition?.() ?? true),
  )

  const context = useQueries({
    queries: () => contextItems.value.map((item) => item.query()),
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

  const isContextReady = computed(() =>
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

  const query = useQuery(
    computed(() => withEnabled(
      params.schema.value.source.query(requestContext.value as never) as TableQueryDefinition,
      isContextReady.value,
    )),
  )

  const rawData = computed<TableExternalState>(() => {
    const result = query.data.value as
      | TableExternalState
      | undefined

    if (Array.isArray(result)) {
      return {
        rows: result,
        rowCount: result.length,
      }
    }

    return {
      rows: result?.rows ?? [],
      rowCount: result?.rowCount ?? 0,
    } as TableExternalState
  })

  const data = computed<TableExternalState>(() => {
    const result = query.data.value

    if (Array.isArray(result) && params.schema.value.source.mode === 'client') {
      return executeClientQuery({
        rows: result,
        request: requestContext.value,
      })
    }

    return rawData.value
  })

  const pageContextItems = computed(() =>
    (params.schema.value.pageContext ?? []).filter((item) => item?.condition?.() ?? true),
  )

  const isPageContextEnabled = computed(() =>
    isContextReady.value && query.isSuccess.value && !query.isFetching.value,
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

  const isPageContextPending = computed(() =>
    isPageContextEnabled.value && pageContextResults.value.some((item) => Boolean(item.isPending)),
  )

  const isPageContextFetching = computed(() =>
    pageContextResults.value.some((item) => Boolean(item.isFetching)),
  )

  const initialized = computed(() =>
    query.isSuccess.value && (!pageContextItems.value.length || pageContextResults.value.every((item) => Boolean(item.isSuccess))),
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
      isFetching:
        isContextFetching.value ||
        isDataFetching ||
        isPageContextFetching.value,
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

function withEnabled<TData = unknown>(
  query: TableQueryDefinition<TData>,
  enabled: boolean,
): TableQueryDefinition<TData> {
  return {
    ...query,
    // @ts-expect-error
    enabled: (query.enabled ?? true) && enabled,
  }
}
