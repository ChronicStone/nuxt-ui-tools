import { tv } from '@nuxt/ui/utils/tv'
import { useAppConfig } from 'nuxt/app'

import buttonTheme from '#build/ui/button'
import checkboxTheme from '#build/ui/checkbox'
import formFieldTheme from '#build/ui/form-field'
import inputTheme from '#build/ui/input'
import inputNumberTheme from '#build/ui/input-number'
import selectMenuTheme from '#build/ui/select-menu'
import switchTheme from '#build/ui/switch'

import type { FormObject, FormUiClass, FormValue } from '../../../types'
import { isRecord } from '../../../utils/path'

/** A Nuxt UI component whose look an inert cell reproduces. */
export type InertComponent =
  | 'button'
  | 'checkbox'
  | 'formField'
  | 'input'
  | 'inputNumber'
  | 'selectMenu'
  | 'switch'

/** Variant values passed to a Nuxt UI theme, as the component computes them. */
export type InertVariants = Readonly<Record<string, string | boolean | undefined>>

/** Classes a caller adds to a theme slot, as a Nuxt UI component passes them. */
export type InertClass = FormUiClass | false | null | undefined | readonly InertClass[]

/** Classes of one theme slot, merged with the classes a caller adds, as `ui.slot({ class })`. */
export type InertSlot = (props?: { class?: InertClass; active?: boolean }) => string

/** Theme slots inert cells read, named as the Nuxt UI themes of their components name them. */
export type InertSlotName =
  | 'base'
  | 'container'
  | 'decrement'
  | 'error'
  | 'icon'
  | 'increment'
  | 'indicator'
  | 'label'
  | 'leading'
  | 'leadingIcon'
  | 'placeholder'
  | 'root'
  | 'thumb'
  | 'trailing'
  | 'trailingIcon'
  | 'value'
  | 'wrapper'

/** Slot class functions of one component for one set of variants. */
export type InertSlots = Readonly<Record<InertSlotName, InertSlot>>

const THEMES = {
  button: buttonTheme,
  checkbox: checkboxTheme,
  formField: formFieldTheme,
  input: inputTheme,
  inputNumber: inputNumberTheme,
  selectMenu: selectMenuTheme,
  switch: switchTheme,
} satisfies Record<InertComponent, FormValue>

/**
 * Resolves the theme slots of Nuxt UI components the way the components do, from the generated
 * theme and the app config through Nuxt UI's `tv`, and keeps each result for its variants: a
 * component instance computes its slots itself, while every inert cell of a column shares them.
 */
export function createInertTheme() {
  const appConfig = useAppConfig()
  const cache = new Map<string, InertSlots>()

  function slots(component: InertComponent, variants: InertVariants) {
    const key = `${component}:${JSON.stringify(variants)}`
    const cached = cache.get(key)
    if (cached) {
      return cached
    }
    const ui: FormObject = isRecord(appConfig.ui) ? appConfig.ui : {}
    const entry = ui[component]
    const override: FormObject = isRecord(entry) ? entry : {}
    const resolved = callTheme({ extend: THEMES[component], ...override }, variants)
    cache.set(key, resolved)
    return resolved
  }

  return { slots }
}

export type InertTheme = ReturnType<typeof createInertTheme>

type ThemeFactory = (
  config: Readonly<Record<string, FormValue>>,
) => (variants: InertVariants) => InertSlots

// SAFETY: Nuxt UI builds every component theme with this call, the generated theme as `extend` and
// the app config entry spread over it, and the result maps each slot to a class function; only its
// generic signature cannot express a theme known at runtime.
const buildTheme = tv as unknown as ThemeFactory

function callTheme(config: Readonly<Record<string, FormValue>>, variants: InertVariants) {
  return buildTheme(config)(variants)
}
