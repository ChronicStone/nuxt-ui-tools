import type { DisplayKind, DisplayPropsMap, DisplayUiMap } from './registry'
import type { DisplayBuiltinTone, DisplayToneRegistry } from './shared'

/**
 * Colors of a tone, as CSS colors. Only `color` is needed for a new tone: the ink defaults to it,
 * the soft background and the line mix it into the page background.
 */
export interface DisplayToneColors {
  /** Solid fill: bars, dots, current steps. */
  color?: string
  /** Text and icons drawn on the page. */
  ink?: string
  /** Tinted background. */
  soft?: string
  /** Border. */
  line?: string
  /** Text on the solid fill. */
  contrast?: string
}

/** A tone registered or restyled in `appConfig.nuxtUiTools.display.tones`. */
export interface DisplayToneDefinition extends DisplayToneColors {
  /** Colors used in dark mode, over the light ones. */
  dark?: DisplayToneColors
}

/** Tones by name: new ones need `color`; a built-in tone takes only the colors it changes. */
export type DisplayToneDefinitions = Record<
  Extract<keyof DisplayToneRegistry, string>,
  DisplayToneDefinition & { color: string }
> &
  Partial<Record<DisplayBuiltinTone, DisplayToneDefinition>>

/** Named default props per kind, picked with `preset`. */
export type DisplayPresets = {
  [K in DisplayKind]?: Readonly<Record<string, Partial<DisplayPropsMap[K]>>>
}

/**
 * App-wide display defaults, from `appConfig.nuxtUiTools.display`.
 *
 * @example
 * ```ts
 * export default defineAppConfig({
 *   nuxtUiTools: {
 *     display: {
 *       presets: { text: { legal: { appearance: 'legal', icon: 'i-lucide-shield' } } },
 *       tones: { violet: { color: 'var(--color-violet-500)' }, primary: { ink: '#b85e00' } },
 *       ui: { facts: { label: 'text-muted', value: 'font-semibold' } },
 *     },
 *   },
 * })
 * ```
 */
export interface DisplayUiConfig {
  presets?: DisplayPresets
  /** Extra tones, and color changes to the built-in ones. Register new names in `DisplayToneRegistry`. */
  tones?: Partial<DisplayToneDefinitions>
  ui?: Partial<DisplayUiMap>
}
