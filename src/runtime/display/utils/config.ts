import type { AppConfig } from 'nuxt/schema'

import type { DisplayKind, DisplayPropsMap, DisplayUiConfig } from '../types'

/** `appConfig.nuxtUiTools.display`, or an empty config. */
export function resolveAppDisplayConfig(config: Pick<AppConfig, 'nuxtUiTools'>): DisplayUiConfig {
  return config.nuxtUiTools?.display ?? {}
}

/** The props of a block over the defaults of its preset; an unknown preset changes nothing. */
export function applyDisplayPreset<TKind extends DisplayKind>(
  kind: TKind,
  props: DisplayPropsMap[TKind],
  preset: string | undefined,
  config: DisplayUiConfig,
): DisplayPropsMap[TKind] {
  const defaults = preset === undefined ? undefined : config.presets?.[kind]?.[preset]
  return defaults ? { ...defaults, ...props } : props
}
