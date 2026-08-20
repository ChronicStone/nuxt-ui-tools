import type { QueryFunction, QueryKey, UseQueryOptions } from '@tanstack/vue-query'

import type { GenericObject } from '#ui-tools/shared/types/utils'

/** Runtime values decoded from spreadsheet cells, rows, and external references. */
export type SpreadsheetValue = GenericObject[string]

/** Named row/context contract for spreadsheet data that is decoded at runtime. */
export type SpreadsheetRecord = { [key: string]: SpreadsheetValue }

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
  | ((params: { header: SpreadsheetHeaderMatchInput }) => number | null)

export interface SpreadsheetMatchDefinition {
  headers: readonly SpreadsheetHeaderMatcher[]
  prefer?: 'first' | 'best-score'
  minScore?: number
  required?: boolean
}

export type SpreadsheetIssueLevel = 'info' | 'warning' | 'error'
