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
  /** Card menu of the blocks that do not set their own. */
  menu: ComputedRef<DashboardMenu | undefined>
  /** `freshness` of the blocks that do not set their own. */
  freshness: ComputedRef<boolean | undefined>
}

const dashboardGridKey: InjectionKey<DashboardGridContext> = Symbol('nuxt-ui-tools.dashboard-grid')

/**
 * Lets blocks know whether they sit in a `panels` grid (joined cells, no card borders), and hands
 * them the grid's block defaults. A nested grid inherits the defaults it does not set.
 */
export function provideDashboardGrid(params: {
  panels: () => boolean
  menu: () => DashboardMenu | undefined
  freshness: () => boolean | undefined
}) {
  const parent = useDashboardGridContext()
  provide(dashboardGridKey, {
    freshness: computed(() => params.freshness() ?? parent?.freshness.value),
    menu: computed(() => params.menu() ?? parent?.menu.value),
    panels: computed(params.panels),
  })
}

export function useDashboardGridContext(): DashboardGridContext | null {
  return inject(dashboardGridKey, null)
}
