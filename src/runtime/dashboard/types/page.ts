import type { DashboardFiltersTarget } from './controls'
import type { DashboardViewController } from './schema'

/** What `UiDashboardPage` renders: the dashboard object returned by `useDashboard`. */
export interface DashboardPageTarget extends DashboardFiltersTarget {
  refresh: () => Promise<void>
  readonly refreshing: boolean
  readonly updatedAt: number | undefined
  autoRefresh: number
}

/** A dashboard with views: `UiDashboardPage` renders their tabs and the current one's slot. */
export interface DashboardViewsTarget {
  readonly view: DashboardViewController<string>
}

/** Names of a dashboard's views, which name the view slots of `UiDashboardPage`. */
export type DashboardViewKeysOf<TDashboard> = TDashboard extends {
  readonly view: DashboardViewController<infer TKey>
}
  ? TKey
  : never
