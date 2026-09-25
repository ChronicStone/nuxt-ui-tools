import type { ButtonProps } from '@nuxt/ui/components/Button.vue'
import type { DropdownMenuItem } from '@nuxt/ui/components/DropdownMenu.vue'
import type { RouteLocationRaw } from 'vue-router'

import type { LazyTextValue } from '../../shared/types/utils'
import type { DashboardFilterControl } from './controls'
import type { DashboardBlockUi } from './ui'

/** Formats a numeric value for axes, tooltips, legends, and totals. */
export type DashboardValueFormatter = (value: number) => string

/**
 * Named number formats, in the dashboard locale:
 *
 * - `number`: grouped, one decimal at most, compact from 10,000 (`12.6K`). The block default.
 * - `integer`: grouped, no decimals (`12,345`).
 * - `decimal`: one decimal at most (`3.5`).
 * - `compact`: short form (`12K`, `1.2M`).
 * - `percent`: a share out of 100 (`57` → `57%`).
 * - `ratio`: a share out of 1 (`0.57` → `57%`).
 * - `delta`: a signed percent change (`12.4` → `+12.4%`).
 * - `points`: a signed difference of percentages (`2.1` → `+2.1 pts`).
 * - `signed`: a signed number (`3` → `+3`).
 */
export type DashboardFormatPreset =
  | 'number'
  | 'integer'
  | 'decimal'
  | 'compact'
  | 'percent'
  | 'ratio'
  | 'delta'
  | 'points'
  | 'signed'

/**
 * How a block formats numbers: a preset (`'integer'`), `Intl.NumberFormat` options, or a function.
 * Options with a `currency` and no `style` format whole amounts in that currency: `{ currency: 'EUR' }`,
 * or `{ currency: 'EUR', notation: 'compact' }` for an axis.
 */
export type DashboardValueFormat =
  | DashboardFormatPreset
  | Intl.NumberFormatOptions
  | DashboardValueFormatter

/**
 * Series color: a palette slot (`'series-1'` … `'series-6'`), a Nuxt UI color (`'primary'`,
 * `'success'`, `'warning'`, `'error'`, `'info'`, `'neutral'`), or any CSS color / `var(--x)`.
 * Omitted colors follow the palette order.
 */
export type DashboardSeriesColor = string

/** One series of a chart, read from each row through an accessor. */
export interface DashboardSeries<TRow> {
  /** Stable identity, also used for legend keys. */
  key: string
  label?: LazyTextValue
  value: (row: TRow, index: number) => number | null | undefined
  color?: DashboardSeriesColor
  /** Draws the series as a dashed line (comparison / previous period). */
  dashed?: boolean
  /** Combo charts only: how the series is drawn. Defaults to the chart's own mark. */
  type?: 'bar' | 'line' | 'area'
  /**
   * Combo charts only: which value axis a line or area series uses. Defaults to `'left'`. Bars
   * always use the left axis.
   */
  axis?: 'left' | 'right'
  /**
   * The same measure over the comparison period (previous period, previous year). Drawn next to the
   * series in a faded tone of its color (dashed for lines), and listed in the legend, tooltip,
   * table view, and CSV.
   */
  compare?: (row: TRow, index: number) => number | null | undefined
  /** Legend label of `compare`. Defaults to "<label> (previous period)". */
  compareLabel?: LazyTextValue
}

/**
 * Emphasized bars of a bar chart: the largest, the smallest, the last, or the rows an accessor
 * picks. The other bars take a faded tone of their color.
 */
export type DashboardHighlight<TRow> =
  | 'max'
  | 'min'
  | 'last'
  | ((row: TRow, index: number) => boolean)

/**
 * Rows shown as selected, typically the value a `select` handler stored in a filter (drill-down,
 * cross-filter). Selected rows are marked; in charts the other bars, points, and segments recede.
 */
export type DashboardSelected<TRow> = (row: TRow, index: number) => boolean

/** Footer totals of a chart, one per solid series: `true` or `'sum'` adds them up, `'average'` averages them. */
export type DashboardChartTotals = boolean | 'sum' | 'average'

export interface DashboardAxisOptions {
  format?: DashboardValueFormat
  /** Fixed domain bounds. Defaults to `0` and a rounded maximum of the data. */
  min?: number
  max?: number
  /** Number of intervals between ticks. Defaults to a readable count for the maximum. */
  ticks?: number
}

/** Horizontal reference line, e.g. an objective. */
export interface DashboardReferenceLine {
  value: number
  label?: LazyTextValue
  axis?: 'left' | 'right'
  /** Where the label sits along the line. Defaults to `'end'`. */
  position?: 'start' | 'end'
}

/** Shape of the loading skeleton, one per block family. */
export type DashboardSkeletonKind =
  | 'stat'
  | 'bars'
  | 'lines'
  | 'donut'
  | 'rows'
  | 'hbars'
  | 'funnel'
  | 'stack'
  | 'paired'
  | 'feed'
  | 'table'
  | 'stats'
  | 'gauge'
  | 'details'

/**
 * Built-in card menu actions: `table` switches the content to a data table, `csv` downloads that
 * data, `expand` opens the card in a large dialog.
 */
export type DashboardMenuAction = 'table' | 'csv' | 'expand'

/** Entries of a card menu: built-in actions and Nuxt UI dropdown items, in display order. */
export type DashboardMenuEntries = readonly (DashboardMenuAction | DropdownMenuItem)[]

/** What a function `menu` receives: the block's own data actions, to reuse in custom items. */
export interface DashboardMenuContext {
  /** Resolved block title. */
  title: string
  /** The block's tabular data (the table view / CSV source); `undefined` until content shows. */
  table: () => DashboardDataTable | undefined
  /** Downloads that table as CSV. */
  download: () => void
  /** Opens the expand dialog. */
  expand: () => void
}

/**
 * Card menu, opened from a `…` button in the header. `true` lists every built-in action the block
 * supports; an array picks and orders built-in actions and mixes in Nuxt UI dropdown items; a
 * function builds that array from the block's context (its table, CSV download, expand).
 */
export type DashboardMenu =
  | boolean
  | DashboardMenuEntries
  | ((context: DashboardMenuContext) => DashboardMenuEntries)

/**
 * Button of a block, in its header next to the menu (default) or full width under the content.
 * Takes any Nuxt UI button prop: `label`, `icon`, `to`, `onClick`, `color`, `variant`, `loading`…
 */
export interface DashboardAction extends ButtonProps {
  placement?: 'header' | 'footer'
}

/** Action on one row: a Nuxt UI dropdown item, listed in the row's `⋮` menu. */
export interface DashboardRowAction extends DropdownMenuItem {
  /** Renders the action as an icon button on the row instead (needs an `icon`). */
  inline?: boolean
}

/** Builds the actions of one row. An empty result leaves the row without actions. */
export type DashboardRowActions<TRow> = (
  row: TRow,
  index: number,
) => readonly DashboardRowAction[] | null | undefined

/** One column of a block's tabular data. */
export interface DashboardDataColumn {
  key: string
  label: string
  /** Numeric columns align to the end and export their raw values. */
  numeric: boolean
}

/** One cell: the raw value (exported to CSV) and its display text. */
export interface DashboardDataCell {
  value: string | number | null
  text: string
}

/** Tabular view of a block's data, behind the `table` and `csv` menu actions. */
export interface DashboardDataTable {
  columns: DashboardDataColumn[]
  rows: DashboardDataCell[][]
}

/** A point in time as blocks receive it: a `Date`, epoch milliseconds, or an ISO string. */
export type DashboardTimeValue = Date | number | string

/** Payload of a block's `select` event: the clicked row and its index in the source data. */
export interface DashboardSelectEvent<TRow> {
  row: TRow
  index: number
}

/** Status of a KPI, shown as a colored dot and label on the title row. */
export interface DashboardStatus {
  color: 'success' | 'warning' | 'error' | 'info' | 'neutral'
  label?: LazyTextValue
}

/** Severity of an alert row, most severe first. */
export type DashboardAlertSeverity = 'error' | 'warning' | 'info' | 'success'

/** Button at the end of an alert row. */
export interface DashboardAlertAction {
  label: LazyTextValue
  icon?: string
  to?: RouteLocationRaw
  onClick?: (event: MouseEvent) => void
}

/** One column of `UiDashboardTable`. */
export interface DashboardTableColumn<TRow> {
  /** Stable identity: sort key and `#cell-<key>` slot name. */
  key: string
  label?: LazyTextValue
  /** Cell value. Numbers go through `format` and sort numerically. */
  value: (row: TRow, index: number) => LazyTextValue | null | undefined
  /**
   * `text` (default); `number`; `delta` (signed percent, colored by sign); `percent` (a share);
   * `bar` (the number with an inline bar scaled to the column maximum).
   */
  type?: 'text' | 'number' | 'delta' | 'percent' | 'bar'
  format?: DashboardValueFormat
  /** `delta` columns: a decrease is good news. */
  invert?: boolean
  /** `bar` columns: bar color. */
  color?: DashboardSeriesColor
  /** `bar` columns: value of a full bar. Defaults to the column maximum. */
  max?: number
  /** Defaults to `end` for numeric types, `start` otherwise. */
  align?: 'start' | 'center' | 'end'
  /** Header click sorts by this column. Defaults to `true`. */
  sortable?: boolean
  /** Column width, any CSS length. */
  width?: string
  /** Classes of the column's cells. */
  class?: string
}

/** Sort state of `UiDashboardTable` (`v-model:sort`). */
export interface DashboardTableSort {
  key: string
  direction: 'asc' | 'desc'
}

/** Visual state a block renders, reduced from its source. */
export type DashboardBlockPhase = 'idle' | 'loading' | 'empty' | 'error' | 'content'

/**
 * When a block activates a `deferred` source: once it scrolls near the viewport (default), as soon
 * as it mounts, or never (`manual`, the app calls `source.activate()`).
 */
export type DashboardBlockActivation = 'visible' | 'mount' | 'manual'

/** Empty state content, shown when a source is ready but has nothing to display. */
export interface DashboardEmptyContent {
  icon?: string
  title?: LazyTextValue
  description?: LazyTextValue
}

/** Props shared by every block. */
export interface DashboardBlockBaseProps {
  title?: LazyTextValue
  subtitle?: LazyTextValue
  /** Grid span, responsive: `"12 md:6 xl:4"`. Defaults to the full row. */
  size?: string
  /** Render without card chrome (no border, padding, or background). Defaults to `true`. */
  card?: boolean
  activation?: DashboardBlockActivation
  /** Empty state content. Defaults to a localized "no data" message. */
  empty?: DashboardEmptyContent
  /** Card menu. Inherits the enclosing grid's `menu` when omitted. */
  menu?: DashboardMenu
  /** Buttons in the header, next to the menu, or full width under the content (`placement`). */
  actions?: readonly DashboardAction[]
  /**
   * Filters narrowing this block, such as a drill-down value picked on another block: each one
   * shows as a removable chip in the toolbar while it differs from its default.
   */
  filters?: readonly DashboardFilterControl[]
  /**
   * Shows when the data was last fetched ("Updated 3 min ago") under the content. Inherits the
   * enclosing grid's `freshness` when omitted.
   */
  freshness?: boolean
  /** Class overrides for the card parts, merged over `appConfig.nuxtUiTools.dashboard.card`. */
  ui?: DashboardBlockUi
}

/** One figure of `UiDashboardStats`, read from the source data. */
export interface DashboardStatsItem<TData> {
  /** Stable identity. */
  key: string
  label: LazyTextValue
  /** Numbers go through `format` (locale number format by default). */
  value: (data: TData) => LazyTextValue | null | undefined
  format?: DashboardValueFormat
  /** Change in percent, colored by sign. `null` hides it. */
  delta?: (data: TData) => number | null | undefined
  /** A decrease is good news. */
  invertDelta?: boolean
  /** Secondary text after the delta. */
  caption?: LazyTextValue | ((data: TData) => LazyTextValue | undefined)
  icon?: string
  /** Accent of the icon and the progress bar. Defaults to the palette order. */
  color?: DashboardSeriesColor
  /** Completion in percent (0–100), drawn as a bar under the value. `null` hides it. */
  progress?: (data: TData) => number | null | undefined
  /** Badge next to the value ("Good", "At risk"). `null` hides it. */
  status?: (data: TData) => DashboardStatus | null | undefined
}

/** One field of `UiDashboardDetails`: a label over its value, read from the source data. */
export interface DashboardDetailsItem<TData> {
  /** Stable identity, and the name of its slot: `#item-vatNumber`. */
  key: string
  label: LazyTextValue
  /**
   * Numbers go through `format`. `null`, `undefined`, and `''` read as empty: a muted dash, or
   * `placeholder`.
   */
  value: (data: TData) => LazyTextValue | number | null | undefined
  format?: DashboardValueFormat
  /** Text under the value (a date of change, a unit, a source). */
  hint?: (data: TData) => LazyTextValue | null | undefined
  /** Shown when the value is empty. Defaults to a dash. */
  placeholder?: LazyTextValue
  /** Monospace value, for identifiers and codes. */
  mono?: boolean
  /** A copy button after a non-empty value, for identifiers people paste elsewhere. */
  copy?: boolean
  /** Makes the value a link. */
  to?: (data: TData) => RouteLocationRaw | null | undefined
  /** Columns the field spans: a number, or `'full'` for the whole row. */
  span?: number | 'full'
  /** Leaves the field out, e.g. a field that only applies to some records. */
  hidden?: (data: TData) => boolean
}

/** One tab of `UiDashboardTabs`. */
export interface DashboardTab<TValue extends string | number = string | number> {
  value: TValue
  label: LazyTextValue
  icon?: string
  /** Count shown after the label (items waiting in that tab…). */
  count?: number | null
  disabled?: boolean
}

/** Legend entry rendered in a block header. */
export interface DashboardLegendItem {
  key: string
  label: string
  color: string
  dashed?: boolean
}
