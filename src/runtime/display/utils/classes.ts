import { twMerge } from 'tailwind-merge'

import type { DisplayUiSlots } from '../types'

/** Merges each slot's defaults with the app config and the block `ui`, later layers winning. */
export function resolveDisplayClasses<TSlot extends string>(
  defaults: Record<TSlot, string>,
  ...layers: (DisplayUiSlots<TSlot> | undefined)[]
): Record<TSlot, string> {
  const resolved = { ...defaults }
  for (const key in defaults)
    resolved[key] = twMerge(defaults[key], ...layers.map((layer) => layer?.[key]))
  return resolved
}
