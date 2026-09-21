/**
 * Class overrides for dashboard blocks. Every slot is merged (tailwind-merge) in this order:
 * library defaults → `appConfig.nuxtUiTools.dashboard` → the block's `ui` prop.
 */

/** Card chrome shared by every block. */
export interface DashboardBlockUi {
  root?: string
  header?: string
  title?: string
  subtitle?: string
  actions?: string
  /** Row under the header (`#toolbar` slot). */
  toolbar?: string
  body?: string
  footer?: string
}

export interface DashboardGridUi {
  root?: string
  /** Container of `variant="panels"` grids: joined cells separated by 1px rules. */
  panels?: string
  /** Card root of blocks placed inside a `panels` grid. */
  panel?: string
}

export interface DashboardStatUi {
  /** KPI label, rendered as the card title. */
  label?: string
  value?: string
  /** Row under the value: delta, then caption. */
  meta?: string
  delta?: string
  /** `▲` / `▼` before the delta. */
  mark?: string
  caption?: string
}

export interface DashboardLegendUi {
  root?: string
  item?: string
  swatch?: string
}

export interface DashboardTotalUi {
  root?: string
  label?: string
  value?: string
}

export interface DashboardListUi {
  row?: string
  avatar?: string
  code?: string
  label?: string
  description?: string
  share?: string
  delta?: string
  value?: string
}

export interface DashboardBarsUi {
  row?: string
  label?: string
  tag?: string
  meta?: string
  track?: string
  fill?: string
}

export interface DashboardPairedBarsUi {
  row?: string
  label?: string
  track?: string
  value?: string
}

export interface DashboardFunnelUi {
  step?: string
  label?: string
  value?: string
  note?: string
  track?: string
}

export interface DashboardStackBarUi {
  track?: string
  legend?: string
  item?: string
}

export interface DashboardDonutUi {
  legend?: string
  item?: string
  /** Big value in the middle of the ring. */
  center?: string
  centerLabel?: string
}

export interface DashboardStateUi {
  root?: string
  icon?: string
  title?: string
  description?: string
}

/**
 * App-wide dashboard theming, read from `appConfig.nuxtUiTools.dashboard`.
 *
 * @example
 * ```ts
 * export default defineAppConfig({
 *   nuxtUiTools: {
 *     dashboard: {
 *       card: { root: 'px-6 py-5', title: 'font-semibold' },
 *       stat: { value: 'font-light tracking-tight' },
 *     },
 *   },
 * })
 * ```
 */
export interface DashboardUiConfig {
  card?: DashboardBlockUi
  grid?: DashboardGridUi
  stat?: DashboardStatUi
  legend?: DashboardLegendUi
  total?: DashboardTotalUi
  list?: DashboardListUi
  bars?: DashboardBarsUi
  pairedBars?: DashboardPairedBarsUi
  funnel?: DashboardFunnelUi
  stackBar?: DashboardStackBarUi
  donut?: DashboardDonutUi
  state?: DashboardStateUi
}
