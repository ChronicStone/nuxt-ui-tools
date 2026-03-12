import type {
  GenericObject,
  TableLayout,
  TablePaginationState,
  TableSortingRule,
} from './utils'

export interface TableState<
  TFilterKey extends string = string,
  TSortKey extends string = string,
  TView extends string = string,
> {
  layout: TableLayout
  pagination: TablePaginationState
  sorting: readonly TableSortingRule<TSortKey>[]
  filters: Partial<Record<TFilterKey, unknown>>
  search: string
  activeView: TView | undefined
  selectedRowKeys: readonly (string | number)[]
}

export interface TableLoadingPhases {
  context: boolean
  data: boolean
  pageContext: boolean
}

export interface TableErrorPhases {
  context: Error | null
  data: Error | null
  pageContext: Error | null
}

export interface TableMeta<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
> {
  rows: readonly TRow[]
  rowCount: number
  pageCount: number
  selectedRows: readonly TRow[]
  selectedCount: number
  isLoading: boolean
  loading: TableLoadingPhases
  error: Error | null
  errors: TableErrorPhases
  context: TContext
  pageContext: TPageContext
}

export interface TablePersistenceOptions {
  state?: boolean
  preferences?: boolean
}

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
