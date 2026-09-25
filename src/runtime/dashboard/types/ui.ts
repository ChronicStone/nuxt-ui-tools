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
  /** Row of `actions` placed under the content (`placement: 'footer'`). */
  footerActions?: string
  /** `…` button of the card menu. */
  menu?: string
  /** "Updated 3 min ago" line under the content. */
  freshness?: string
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
  /** Colored dot and label of `status`, on the title row. */
  status?: string
  /** Sparkline of `trend`. */
  trend?: string
  /** Track of the `goal` progress bar. */
  progress?: string
  /** Line under the progress bar: goal and completion. */
  goal?: string
}

export interface DashboardDetailsUi {
  /** The description list: a grid of fields. */
  grid?: string
  /** One field; carries `data-empty` while its value is empty. */
  item?: string
  label?: string
  value?: string
  /** Dash or `placeholder` of an empty value. */
  placeholder?: string
  hint?: string
  /** Link of an item with `to`. */
  link?: string
  /** Copy button of an item with `copy`. */
  copy?: string
}

export interface DashboardStatsUi {
  /** Grid of the figures. */
  grid?: string
  item?: string
  /** Icon tile before the label. */
  icon?: string
  label?: string
  value?: string
  /** Row under the value: delta, then caption. */
  meta?: string
  delta?: string
  caption?: string
  /** Track of the `progress` bar. */
  progress?: string
  /** Badge of `status`. */
  status?: string
}

export interface DashboardGaugeUi {
  /** Ring and its centered text. */
  ring?: string
  value?: string
  /** Text under the value, inside the ring. */
  caption?: string
  /** Line under the ring: min / target / max. */
  scale?: string
}

export interface DashboardAlertsUi {
  row?: string
  /** Severity icon tile. */
  icon?: string
  label?: string
  description?: string
  value?: string
  action?: string
}

export interface DashboardFeedUi {
  /** Day heading when `groupBy` is set. */
  group?: string
  item?: string
  /** Icon, avatar, or dot on the timeline rail. */
  marker?: string
  label?: string
  description?: string
  time?: string
}

export interface DashboardTableUi {
  /** Scroll container around the table. */
  wrapper?: string
  table?: string
  head?: string
  /** Header cells. */
  th?: string
  row?: string
  /** Body cells. */
  td?: string
  /** Inline bar of `bar` columns. */
  bar?: string
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
  /** Progress ring of `leading: 'ring'`. */
  ring?: string
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

/** Classes of `UiDashboardFilter`: the pill, its menu, and the `button` variant. */
export interface DashboardFilterUi {
  /** Pill around the trigger and the clear button. Carries `data-active` once the filter filters. */
  root?: string
  trigger?: string
  /** Filter name, before the value. */
  label?: string
  value?: string
  chevron?: string
  /** Clear button of an active pill. */
  clear?: string
  /** Trigger of `variant="button"`. */
  button?: string
  /** Popover panel. */
  content?: string
  /** Heading of the panel (`variant="button"`). */
  title?: string
  search?: string
  list?: string
  item?: string
  /** Checkbox of multiple filters. */
  check?: string
  /** Check mark of the selected item of single filters. */
  tick?: string
  /** Initials tile of items with an `avatar`. */
  avatar?: string
  /** Trailing text of items with a `hint`. */
  hint?: string
  separator?: string
  /** "No results", loading, and error rows. */
  note?: string
}

/** Classes of `UiDashboardFilters`. */
export interface DashboardFiltersUi {
  /** The bar: a row that scrolls sideways on narrow screens and wraps on large ones. */
  root?: string
  reset?: string
}

/**
 * Classes of the chips a block draws in its toolbar: the series a filter picks on a chart, and the
 * drill-down filters (`filters`) a block is narrowed by.
 */
export interface DashboardChipsUi {
  chip?: string
  /** Color square of a series chip. */
  swatch?: string
  /** Filter name, before its value, on a filter chip. */
  label?: string
  remove?: string
}

/** Classes of `UiDashboardPage`. */
export interface DashboardPageUi {
  /** The page, and its scroll container: the tabs and filters stick to its top. */
  root?: string
  /** Carries `data-leading` while the `#leading` slot is filled. */
  header?: string
  /** Around the `#eyebrow` slot, above the title. */
  eyebrow?: string
  /** Around the `#leading` slot (an avatar or a logo), beside the title and its line. */
  leading?: string
  title?: string
  /** Today's date and when the data was fetched, under the title. */
  description?: string
  /** Page actions and the refresh control. */
  actions?: string
  /** Around the `#banner` slot, between the header and the pinned band. */
  banner?: string
  /** Around the `#details` slot: a full-width row closing the header (key facts of an entity). */
  details?: string
  /** Pinned band of the tabs and the filter bar. Carries `data-stuck` once content scrolls under it. */
  toolbar?: string
  tabs?: string
  filters?: string
  /** Around the current view: its padding and the space between its grids. */
  body?: string
}

/** Classes of `UiDashboardViewTabs`. */
export interface DashboardViewTabsUi {
  /** The strip: it scrolls sideways when the tabs overflow. */
  root?: string
  tab?: string
  /** Count or text of a view's `badge`, after the tab label. */
  badge?: string
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
  stats?: DashboardStatsUi
  details?: DashboardDetailsUi
  gauge?: DashboardGaugeUi
  legend?: DashboardLegendUi
  total?: DashboardTotalUi
  list?: DashboardListUi
  bars?: DashboardBarsUi
  pairedBars?: DashboardPairedBarsUi
  funnel?: DashboardFunnelUi
  stackBar?: DashboardStackBarUi
  donut?: DashboardDonutUi
  alerts?: DashboardAlertsUi
  feed?: DashboardFeedUi
  table?: DashboardTableUi
  state?: DashboardStateUi
  filter?: DashboardFilterUi
  filters?: DashboardFiltersUi
  viewTabs?: DashboardViewTabsUi
  page?: DashboardPageUi
  chips?: DashboardChipsUi
}
