import type { DisplayBuiltinTone, DisplaySurface, DisplayTone } from '../types'

const BUILTIN_TONES: readonly DisplayBuiltinTone[] = [
  'primary',
  'secondary',
  'success',
  'info',
  'warning',
  'error',
  'neutral',
]

/**
 * Class that points the `--nut-tone*` variables of an element at a tone. Built-in tones are
 * defined in the token stylesheet; registered ones by the rules the display plugin injects.
 */
export function displayToneClass(tone: DisplayTone) {
  return `nut-display-tone-${tone}`
}

/** Whether a tone is one of the Nuxt UI colors, which Nuxt UI components take as `color`. */
export function isBuiltinTone(tone: string): tone is DisplayBuiltinTone {
  return BUILTIN_TONES.some((builtin) => builtin === tone)
}

/** Box classes of each surface. `plain` adds nothing so a block sits on the page. */
export const DISPLAY_SURFACE_CLASSES = {
  bordered: 'rounded-[var(--nut-display-radius)] border border-default',
  elevated:
    'rounded-[var(--nut-display-radius)] bg-default shadow-[0_10px_28px_-14px_rgb(0_0_0/0.3)] ring ring-default',
  muted: 'rounded-[var(--nut-display-radius)] bg-elevated',
  plain: '',
} as const satisfies Record<DisplaySurface, string>

/** Padding applied inside a boxed surface. */
export const DISPLAY_SURFACE_PADDING = {
  bordered: 'p-4',
  elevated: 'p-4',
  muted: 'p-4',
  plain: '',
} as const satisfies Record<DisplaySurface, string>

const NAME_TONES = ['primary', 'info', 'success', 'warning', 'secondary', 'error'] as const

/** A stable tone for a name, so a person keeps the same tint everywhere. */
export function toneFromName(name: string): DisplayTone {
  let hash = 0
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) % 2_147_483_647
  return NAME_TONES[hash % NAME_TONES.length] ?? 'primary'
}

/** Up to two initials of a name. */
export function initialsOf(name: string) {
  const words = name.trim().split(/\s+/u).filter(Boolean)
  const letters = words.length > 1 ? [words[0], words.at(-1)] : [words[0]]
  return letters
    .map((word) => word?.[0] ?? '')
    .join('')
    .toUpperCase()
}
