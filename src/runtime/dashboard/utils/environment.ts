import type { useUiToolsLocale } from '../../i18n/use-locale'
import type { DashboardRuntimeFilter } from '../types'

export type DashboardLocale = ReturnType<typeof useUiToolsLocale>

/** URL-synced filters of one dashboard, by full URL key. */
export type DashboardFilterRegistry = Map<string, { owner: string; signature: string }>

/**
 * What a dashboard reads from the component that creates it, once, during setup. A dashboard built
 * from a schema function is rebuilt outside setup when the function's input changes; it keeps these.
 */
export interface DashboardEnvironment {
  /** Locale of the creating component (Nuxt UI's `UApp` locale, or the ui-tools one). */
  locale: DashboardLocale
  /** Filters with a URL key, across the dashboard's scopes. */
  registry: DashboardFilterRegistry
}

/**
 * Records a URL-synced filter. A URL key names one filter across the dashboard: two scopes may both
 * declare `year` (they share its value), but not as two different kinds of filter, or with two
 * defaults, which would make the shared value read differently from one tab to the next.
 */
export function registerDashboardFilter(
  registry: DashboardFilterRegistry,
  params: { urlKey: string; owner: string; definition: DashboardRuntimeFilter },
) {
  const { definition } = params
  const signature = [
    definition.kind,
    definition.multiple ? 'multiple' : 'single',
    definition.codec.serialize(definition.defaultValue),
  ].join(':')
  const known = registry.get(params.urlKey)
  if (!known) {
    registry.set(params.urlKey, { owner: params.owner, signature })
    return
  }
  if (known.signature !== signature)
    throw new Error(
      `[dashboard] The filter of ${params.owner} and the filter of ${known.owner} share the URL key "${params.urlKey}", so they share one value, but they are declared differently (${signature} vs ${known.signature}). Declare them the same way, or give one another key or \`urlKey\`.`,
    )
}
