import type { AppConfig } from 'nuxt/schema'
import { twMerge } from 'tailwind-merge'

import type { DisplayKind, DisplayPropsMap, DisplayUiConfig, DisplayUiSlots } from '../types'

/** `appConfig.nuxtUiTools.display`, or an empty config. */
export function resolveAppDisplayConfig(config: Pick<AppConfig, 'nuxtUiTools'>): DisplayUiConfig {
  return config.nuxtUiTools?.display ?? {}
}

/**
 * The props of a block over the defaults of its preset; an unknown preset changes nothing. Slot
 * classes merge per slot, the block's over the preset's, like the other props.
 */
export function applyDisplayPreset<TKind extends DisplayKind>(
  kind: TKind,
  props: DisplayPropsMap[TKind],
  preset: string | undefined,
  config: DisplayUiConfig,
): DisplayPropsMap[TKind] {
  const defaults = preset === undefined ? undefined : config.presets?.[kind]?.[preset]
  if (!defaults) return props
  const merged = { ...defaults, ...props }
  const ui = mergeDisplaySlots(defaults.ui, props.ui)
  return ui ? { ...merged, ui } : merged
}

/** Two slot class maps merged per slot with tailwind-merge, `over` winning conflicts. */
export function mergeDisplaySlots(
  base: DisplayUiSlots<string> | undefined,
  over: DisplayUiSlots<string> | undefined,
): DisplayUiSlots<string> | undefined {
  if (!base || !over) return base ?? over
  const merged: DisplayUiSlots<string> = { ...base }
  for (const [slot, classes] of Object.entries(over)) merged[slot] = twMerge(base[slot], classes)
  return merged
}
