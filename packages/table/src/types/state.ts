import type {
  GenericObject,
  TableLayout,
  TablePaginationState,
  TableSortKey,
  TableSortingRule,
} from './utils'

export interface TableState<
  TFilterKey extends string = string,
  TSortKey extends string = string,
> {
  layout: TableLayout
  pagination: TablePaginationState
  sorting: readonly TableSortingRule<TSortKey>[]
  filters: Partial<Record<TFilterKey, unknown>>
  search: string
  selectedRowKeys: readonly (string | number)[]
}

export interface TablePreferencesState<
  TColumnKey extends string = string,
> {
  visibleColumnKeys: readonly TColumnKey[]
}

export interface TablePersistenceOptions {
  state?: boolean
  preferences?: boolean
}

export type TableControlKey = 'refresh' | 'layout' | 'columns' | 'filters' | 'sort' | 'actions'

export type TableLayoutControl<TLayout extends TableLayout = TableLayout> =
  | boolean
  | string
  | Partial<Record<TLayout, boolean | string>>
  | (() => boolean | Partial<Record<TLayout, boolean | string>>)

export interface TableControlsSchema {
  refresh?: TableLayoutControl
  layout?: TableLayoutControl
  columns?: TableLayoutControl
  filters?: TableLayoutControl
  sort?: TableLayoutControl
  actions?: TableLayoutControl
}

export interface TableSelectionSchema {
  mode?: false | true | 'auto'
}

export interface TableRuntimeState<
  TRow extends GenericObject = GenericObject,
  TFilterKey extends string = string,
  TSortKey extends string = TableSortKey<TRow>,
> {
  state: TableState<TFilterKey, TSortKey>
  rows: readonly TRow[]
  rowCount: number
  isLoading: boolean
  error: Error | null
}
