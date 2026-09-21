import type { AppConfig } from 'nuxt/schema'
import { twMerge } from 'tailwind-merge'

import type { DashboardUiConfig } from '../types'

/**
 * Resolves the classes of one block part: library defaults, then each override layer
 * (app config, then the `ui` prop), merged with tailwind-merge so later layers win.
 */
export function resolveDashboardClasses<TKey extends string>(
  defaults: Record<TKey, string>,
  ...layers: (Partial<Record<NoInfer<TKey>, string>> | undefined)[]
): Record<TKey, string> {
  const resolved = { ...defaults }
  for (const key in defaults) {
    resolved[key] = twMerge(defaults[key], ...layers.map((layer) => layer?.[key]))
  }
  return resolved
}

/** Reads `appConfig.nuxtUiTools.dashboard`; apps that do not declare it get no overrides. */
export function resolveAppDashboardUi(config: Pick<AppConfig, 'nuxtUiTools'>): DashboardUiConfig {
  return config.nuxtUiTools?.dashboard ?? {}
}
