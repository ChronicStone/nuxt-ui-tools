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

export interface SpreadsheetHeaderMatchInput {
  index: number
  text: string
  normalized: string
}

export type SpreadsheetModifier =
  | 'trim'
  | 'lowercase'
  | 'uppercase'
  | 'normalizeSpaces'
  | 'accent-insensitive'
  | 'case-insensitive'

export type SpreadsheetHeaderMatcher =
  | string
  | RegExp
  | ((params: {
      header: SpreadsheetHeaderMatchInput
    }) => number | null)

export interface SpreadsheetMatchDefinition {
  headers: readonly SpreadsheetHeaderMatcher[]
  prefer?: 'first' | 'best-score'
  minScore?: number
  required?: boolean
}

export type SpreadsheetIssueLevel = 'info' | 'warning' | 'error'
