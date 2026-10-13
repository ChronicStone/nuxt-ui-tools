import type { ButtonProps } from '@nuxt/ui/components/Button.vue'
import type { LinkProps } from '@nuxt/ui/components/Link.vue'

import type {
  TableColumnCollection,
  TableSummaryRequest,
  TableSummaryScope,
  TableSummaryValue,
} from './columns'
import type { TableTreeSchema } from './tree'
import type {
  GenericObject,
  TableDefaultSort,
  TableGridSortOption,
  TableLayout,
  TableRowRenderParams,
  RenderableType,
  TableSortKey,
  TableTextValue,
} from './utils'

export interface TablePersistenceOptions {
  state?: boolean
  preferences?: boolean
}

/**
 * The button of a first-use empty state. Any Nuxt UI button prop applies; `label` may be lazy so
 * it follows the locale.
 */
export interface TableEmptyAction extends Omit<ButtonProps, 'ui' | 'label'> {
  label: TableTextValue
  /** Runs on click. Use `to` instead to navigate. */
  onClick?: (event: MouseEvent) => void
}

/**
 * What a list shows when it has no records at all. Anything left out keeps the localized default.
 * A list hidden by filters or a search always offers to reset them instead, never `action`.
 */
export interface TableEmptySchema {
  icon?: string
  title?: TableTextValue
  /** `false` hides the second line. */
  description?: TableTextValue | false
  /** The first thing to do in an empty list, such as creating the first record. */
  action?: TableEmptyAction
}

export type TableLayoutControl<TLayout extends TableLayout = TableLayout> =
  | boolean
  | string
  | Partial<Record<TLayout, boolean | string>>
  | (() => boolean | string | Partial<Record<TLayout, boolean | string>>)

export interface TableControlsSchema {
  refresh?: TableLayoutControl
  layout?: TableLayoutControl
  columns?: TableLayoutControl
  filters?: TableLayoutControl
  sort?: TableLayoutControl
  actions?: TableLayoutControl
  /** The toggle between summary rows and the full table, offered while `table.summary` is active. */
  summary?: TableLayoutControl
}

export interface TableSelectionSchema {
  mode?: false | true | 'auto'
  scope?: 'page' | 'all'
}

export interface PaginationConfig {
  sizeOptions?: number[] | { [key in TableLayout]: number[] }
  defaultSize?: number | { [key in TableLayout]: number }
  showPageSizePicker?: boolean
  showPagesList?: boolean
  showPagesCount?: boolean
}

export type TableOffsetPaginationSchema = PaginationConfig & {
  mode?: 'offset'
}

export interface TableCursorPaginationSchema {
  mode: 'cursor'
  pageSize?: number | Partial<Record<TableLayout, number>>
  count?: 'none' | 'exact'
}

export type TablePaginationSchema =
  | false
  | TableOffsetPaginationSchema
  | TableCursorPaginationSchema

export type TableGridMode = 'flow' | 'contained'

export interface TableGridSchema<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
  TSortKey extends string = TableSortKey<TRow>,
> {
  enabled?: boolean | string | (() => boolean | string)
  mode?: TableGridMode
  renderItem?: (params: TableRowRenderParams<TRow, TContext, TPageContext>) => RenderableType
  renderSkeleton?: (params: { layout?: 'grid' }) => RenderableType
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
  TData = unknown,
> {
  enabled?: boolean | string | (() => boolean | string)
  columns?: TableColumnCollection<TRow, TContext, TPageContext, string, TSortKey, TData>
  /** Lets rows hold child rows that open beneath them. See `TableTreeSchema`. */
  tree?: TableTreeSchema<TRow>
  defaultSorting?: TableDefaultSort<TSortKey>
  selection?: boolean | 'auto'
  summaries?: TableSummariesSchema<TRow>
  /**
   * Reads each record as one compact row instead of a line of columns, the way a phone screen
   * needs it. Off until configured; see `TableRowSummarySchema` for when it applies.
   */
  summary?: TableRowSummarySchema<TRow, TContext, TPageContext>
}

/** One value of a summary row's detail line. Empty values are skipped. */
export type TableRowSummaryValue = string | number | null | undefined | false

/**
 * A record as one summary row: an identity, one status, a couple of useful values and the row
 * actions. Every callback receives the params a grid card gets, with `layout: 'table'`.
 *
 * Summary rows replace the column table, so columns, column sorting and the totals row are not
 * shown while they are active. Filters, search, selection, row actions and pagination work as in
 * the table, and a toggle brings the full table back.
 *
 * @example
 * summary: {
 *   leading: ({ row }) => h(UAvatar, { text: initials(row.name), size: 'md' }),
 *   title: ({ row }) => row.name,
 *   status: ({ row }) => h(UBadge, { label: STATUS[row.status], variant: 'subtle' }),
 *   details: ({ row }) => [row.kind, row.city],
 *   to: ({ row }) => `/accounts/${row.id}`,
 * }
 */
export interface TableRowSummarySchema<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
> {
  /**
   * Where summary rows replace the column table: `true`, `false`, a responsive string, or a
   * getter returning either. The reader can still switch to the table from the toggle.
   * @default 'true md:false' Summary rows below the `md` breakpoint, the table from `md` up.
   * @example 'true lg:false' // summary rows on tablets too
   */
  enabled?: boolean | string | (() => boolean | string)
  /** The record's identity. One line, cut with an ellipsis when it does not fit. */
  title: (params: TableRowRenderParams<TRow, TContext, TPageContext>) => string | number
  /**
   * A 32px tile before the title: an avatar, an icon, initials. It is clipped to a rounded
   * square, so pass an element that fills it.
   */
  leading?: (params: TableRowRenderParams<TRow, TContext, TPageContext>) => RenderableType
  /** One status pill, first on the line under the title. */
  status?: (params: TableRowRenderParams<TRow, TContext, TPageContext>) => RenderableType
  /** The two or so values worth reading without opening the record, joined with " · ". */
  details?: (params: TableRowRenderParams<TRow, TContext, TPageContext>) => TableRowSummaryValue[]
  /** Makes the row a link to the record. Return `undefined` for a row that is not one. */
  to?: (params: TableRowRenderParams<TRow, TContext, TPageContext>) => LinkProps['to'] | undefined
  /** Runs when the row is tapped. With `to`, it runs before the navigation. */
  onSelect?: (params: TableRowRenderParams<TRow, TContext, TPageContext>) => void
}

export interface TableSummariesSchema<TRow extends GenericObject = GenericObject> {
  /** Rows the aggregates describe; defaults to `filtered`. */
  scope?: TableSummaryScope
  /** Scopes the footer toggle offers; defaults to all three when selection is enabled. */
  scopes?: TableSummaryScope[]
  /** Footer label; defaults to a localized "Total". */
  label?: TableTextValue
  /** Resolves every column summary at once, typically from the server; merged over derived values. */
  resolve?: (context: {
    scope: TableSummaryScope
    rows: TRow[]
    request: TableSummaryRequest<TRow>
  }) => Record<string, TableSummaryValue> | Promise<Record<string, TableSummaryValue>>
}
