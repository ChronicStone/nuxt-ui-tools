import { useAppConfig } from 'nuxt/app'
import { computed, inject, provide } from 'vue'
import type { ComputedRef, InjectionKey } from 'vue'

import type { DashboardMenu, DashboardUiConfig } from '../types'
import { resolveAppDashboardUi } from '../utils/ui'

/** App-wide dashboard class overrides from `appConfig.nuxtUiTools.dashboard`. */
export function useDashboardUi(): ComputedRef<DashboardUiConfig> {
  const appConfig = useAppConfig()
  return computed(() => resolveAppDashboardUi(appConfig))
}

interface DashboardGridContext {
  panels: ComputedRef<boolean>
  /** Column count at the current breakpoint. */
  columns: ComputedRef<number>
  /** Space between cells, a CSS length (`1px` in panels, where the gap draws the rules). */
  gap: ComputedRef<string>
  /** Rows that are not full share their free width between their cells. */
  fill: ComputedRef<boolean>
  /** Card menu of the blocks that do not set their own. */
  menu: ComputedRef<DashboardMenu | undefined>
  /** `freshness` of the blocks that do not set their own. */
  freshness: ComputedRef<boolean | undefined>
}

const dashboardGridKey: InjectionKey<DashboardGridContext> = Symbol('nuxt-ui-tools.dashboard-grid')

/**
 * Lets blocks know whether they sit in a `panels` grid (joined cells, no card borders), hands them
 * the grid's block defaults, and the geometry their cell style is computed from. A nested grid
 * inherits the defaults it does not set.
 */
export function provideDashboardGrid(params: {
  panels: () => boolean
  menu: () => DashboardMenu | undefined
  freshness: () => boolean | undefined
  columns: () => number
  gap: () => string
  fill: () => boolean
}) {
  const parent = useDashboardGridContext()
  provide(dashboardGridKey, {
    columns: computed(params.columns),
    fill: computed(params.fill),
    freshness: computed(() => params.freshness() ?? parent?.freshness.value),
    gap: computed(params.gap),
    menu: computed(() => params.menu() ?? parent?.menu.value),
    panels: computed(params.panels),
  })
}

export function useDashboardGridContext(): DashboardGridContext | null {
  return inject(dashboardGridKey, null)
}
