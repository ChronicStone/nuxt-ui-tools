import { useAppConfig } from 'nuxt/app'
import { computed, inject, provide } from 'vue'
import type { ComputedRef, InjectionKey } from 'vue'

import type { DashboardUiConfig } from '../types'
import { resolveAppDashboardUi } from '../utils/ui'

/** App-wide dashboard class overrides from `appConfig.nuxtUiTools.dashboard`. */
export function useDashboardUi(): ComputedRef<DashboardUiConfig> {
  const appConfig = useAppConfig()
  return computed(() => resolveAppDashboardUi(appConfig))
}

interface DashboardGridContext {
  panels: ComputedRef<boolean>
}

const dashboardGridKey: InjectionKey<DashboardGridContext> = Symbol('nuxt-ui-tools.dashboard-grid')

/** Lets blocks know whether they sit in a `panels` grid (joined cells, no card borders). */
export function provideDashboardGrid(panels: () => boolean) {
  provide(dashboardGridKey, { panels: computed(panels) })
}

export function useDashboardGridContext(): DashboardGridContext | null {
  return inject(dashboardGridKey, null)
}
