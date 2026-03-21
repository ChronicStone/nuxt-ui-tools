import type { TableColumnCollection } from './columns'
import type {
  GenericObject,
  TableDefaultSort,
  TableGridSortOption,
  TableLayout,
  TableRowRenderParams,
  TableSortKey,
} from './utils'

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
  scope?: 'page' | 'all'
}

export type PaginationConfig = {
  sizeOptions?: Array<number> | { [key in TableLayout]: Array<number> }
  defaultSize?: number | { [key in TableLayout]: number }
  showPageSizePicker?: boolean
  showPagesList?: boolean
  showPagesCount?: boolean
}

export type TablePaginationSchema = PaginationConfig

export type TableGridMode = 'flow' | 'contained'

export interface TableGridSchema<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
  TSortKey extends string = TableSortKey<TRow>,
> {
  enabled?: boolean | string | (() => boolean | string)
  mode?: TableGridMode
  renderItem?: (params: TableRowRenderParams<TRow, TContext, TPageContext>) => unknown
  renderSkeleton?: (params: { layout?: 'grid' }) => unknown
  gridSize?: number | string | (() => number | string)
  itemSize?: number | string | (() => number | string)
  sortOptions?: TableGridSortOption<TSortKey>[]
  defaultSorting?: TableDefaultSort<TSortKey>
}

export interface TableTableSchema<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
  TSortKey extends string = TableSortKey<TRow>,
> {
  enabled?: boolean | string | (() => boolean | string)
  columns?: TableColumnCollection<TRow, TContext, TPageContext, string, TSortKey>
  treeMode?: boolean
  childrenKey?: TableSortKey<TRow>
  defaultSorting?: TableDefaultSort<TSortKey>
  selection?: boolean | 'auto'
}
