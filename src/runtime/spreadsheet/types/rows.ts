import type {
  SpreadsheetColumnDefinition,
  SpreadsheetColumnGroupDefinition,
  SpreadsheetDynamicCollectionDefinition,
  SpreadsheetDynamicCollectionItemDefinition,
  SpreadsheetDynamicOptionGroupsDefinition,
} from './columns'
import type { SpreadsheetIssueLevel, SpreadsheetRecord } from './shared'

export interface SpreadsheetHeaderCell {
  index: number
  raw: unknown
  text: string
  normalized: string
}

export interface SpreadsheetColumnAssignmentOption {
  key: string
  label: string
  assigned: boolean
}

export interface SpreadsheetColumnMatch<
  TColumn = SpreadsheetColumnDefinition<string, unknown, boolean, unknown>,
> {
  key: string
  columnIndex: number
  header: SpreadsheetHeaderCell
  column: TColumn
}

export interface SpreadsheetUnmatchedColumn<
  TColumn = SpreadsheetColumnDefinition<string, unknown, boolean, unknown>,
> {
  key: string
  column: TColumn
}

export interface SpreadsheetDynamicColumnMatch<
  TColumn =
    | SpreadsheetDynamicOptionGroupsDefinition<string, string, unknown>
    | SpreadsheetDynamicCollectionDefinition<string, 'array' | 'record'>,
  TItem = SpreadsheetDynamicCollectionItemDefinition,
> {
  key: string
  targetKey: string
  columnIndex: number
  header: SpreadsheetHeaderCell
  column: TColumn
  source: unknown
  item?: TItem
}

export interface SpreadsheetRowIssue {
  level: SpreadsheetIssueLevel
  code: string
  message: string
  rowIndex: number
  ruleKey?: string
  columnKey?: string
  columnIndex?: number
  header?: string
}

export interface SpreadsheetParsedRow<TRow = SpreadsheetRecord> {
  index: number
  source: readonly unknown[]
  data: TRow
  issues: readonly SpreadsheetRowIssue[]
  isValid: boolean
}

export interface SpreadsheetRowSummary {
  totalRows: number
  validRows: number
  invalidRows: number
  issueCount: number
}

export type SpreadsheetStaticColumn = SpreadsheetColumnDefinition<string, unknown, boolean, unknown>

export type SpreadsheetStaticColumnGroup = SpreadsheetColumnGroupDefinition<
  string,
  readonly SpreadsheetRuntimeStaticColumnEntry[]
>

export type SpreadsheetRuntimeStaticColumnEntry =
  | SpreadsheetStaticColumn
  | SpreadsheetStaticColumnGroup
