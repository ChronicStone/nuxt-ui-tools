import type { LazyTextValue } from '../../shared/types/utils'
import type { DashboardBlockUi } from './ui'

/** Formats a numeric value for axes, tooltips, legends, and totals. */
export type DashboardValueFormat = (value: number) => string

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
}

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
  /** Grid row span, responsive. */
  rows?: string
  /** Render without card chrome (no border, padding, or background). Defaults to `true`. */
  card?: boolean
  activation?: DashboardBlockActivation
  /** Empty state content. Defaults to a localized "no data" message. */
  empty?: DashboardEmptyContent
  /** Class overrides for the card parts, merged over `appConfig.nuxtUiTools.dashboard.card`. */
  ui?: DashboardBlockUi
}

/** Legend entry rendered in a block header. */
export interface DashboardLegendItem {
  key: string
  label: string
  color: string
  dashed?: boolean
}
