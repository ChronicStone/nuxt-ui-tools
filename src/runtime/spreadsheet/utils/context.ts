import type { SpreadsheetContextItem, SpreadsheetContextDataFromItems } from '../types'

export interface SpreadsheetContextQueryResult {
  key?: string
  data?: unknown
  error?: unknown
  isPending?: boolean
  isFetching?: boolean
  isSuccess?: boolean
  isRefetching?: boolean
  refetch: () => Promise<unknown>
}

export function createSpreadsheetContextQueries<
  TItems extends readonly SpreadsheetContextItem<string, unknown>[],
>(items: TItems) {
  return items.map((item) => item.query())
}

export function createSpreadsheetContextData<
  TItems extends readonly SpreadsheetContextItem<string, unknown>[],
>(
  items: TItems,
  results: readonly Pick<SpreadsheetContextQueryResult, 'data'>[],
) {
  return items.reduce<Partial<SpreadsheetContextDataFromItems<TItems>>>((acc, item, index) => ({
    ...acc,
    [item.key]: results[index]?.data,
  }), {})
}

export function createSpreadsheetContextStatus(
  results: readonly Pick<
    SpreadsheetContextQueryResult,
    'isPending' | 'isFetching' | 'isSuccess' | 'isRefetching'
  >[],
) {
  const isPending = results.some((result) => Boolean(result.isPending))
  const isFetching = results.some((result) => Boolean(result.isFetching))
  const isReady = !results.length || results.every((result) => Boolean(result.isSuccess))
  const isRefreshing = results.some((result) => Boolean(result.isRefetching))

  return {
    initialized: true,
    isPending,
    isFetching,
    isReady,
    isRefreshing,
  }
}
