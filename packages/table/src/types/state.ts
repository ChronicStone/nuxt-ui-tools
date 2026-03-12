import type {
  GenericObject,
  TableLayout,
  TablePaginationState,
  TableSortKey,
  TableSortingRule,
} from './utils'

// ---------------------------------------------------------------------------
// User-controlled state (persisted, URL-serializable)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Derived / runtime meta (not persisted, computed from state + source results)
// ---------------------------------------------------------------------------

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
  /** Current page rows */
  rows: readonly TRow[]
  /** Total matching row count (server-reported for remote, filtered count for client) */
  rowCount: number
  /** Derived from rowCount / pageSize */
  pageCount: number
  /** Derived from selectedRowKeys + rows */
  selectedRows: readonly TRow[]
  selectedCount: number
  /** True if any loading phase is active */
  isLoading: boolean
  /** Per-phase loading flags */
  loading: TableLoadingPhases
  /** Most recent error from any phase */
  error: Error | null
  /** Per-phase errors */
  errors: TableErrorPhases
  /** Resolved context data (loaded before table data) */
  context: TContext
  /** Resolved page context data (loaded after table data, receives current rows) */
  pageContext: TPageContext
}

// ---------------------------------------------------------------------------
// Column preferences (visibility, order, pinning)
// ---------------------------------------------------------------------------

export interface TablePreferencesState<
  TColumnKey extends string = string,
> {
  visibleColumnKeys: readonly TColumnKey[]
}

// ---------------------------------------------------------------------------
// Schema-level config types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Legacy runtime shape (kept during migration)
// ---------------------------------------------------------------------------

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
