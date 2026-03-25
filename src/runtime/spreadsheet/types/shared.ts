import type { QueryFunction, QueryKey, UseQueryOptions } from '@tanstack/vue-query'

export type SpreadsheetQueryDefinition<TData = unknown> = Omit<
  UseQueryOptions<TData>,
  'queryFn'
> & {
  queryKey: QueryKey
  queryFn?: QueryFunction<TData>
}

export interface SpreadsheetCellValue {
  text: string
  raw: unknown
  header: string
  columnIndex: number
  rowIndex: number
}

export type SpreadsheetIssueLevel = 'info' | 'warning' | 'error'
