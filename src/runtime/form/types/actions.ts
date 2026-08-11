import type { FormApi } from './api'
import type { FormText } from './utils'

export type FormActionKey = 'reset' | 'cancel' | 'submit' | 'previous' | 'next'
export type FormActionSlot = 'left' | 'right' | (string & {})
export type FormActionWidth = 'fit' | 'fill' | (string & {})
export type FormActionType = 'primary' | (string & {})
export type FormActionColor =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'info'
  | 'warning'
  | 'error'
  | 'neutral'
export type FormActionVariant = 'solid' | 'outline' | 'soft' | 'subtle' | 'ghost' | 'link'
export type FormActionSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

/**
 * Runtime context passed to form action conditions, disabled callbacks, links, and handlers.
 */
export interface FormActionContext {
  /** Current zero-based step index. */
  currentStep: number
  /** Public form API for state, validation, focus, submit, and reset operations. */
  api: FormApi
  /** Current pending action, if a built-in action is running. */
  actionPending: FormActionKey | null
  /** True when the rendered schema has steps. */
  isMultiStep: boolean
  /** True on the first step or on non-stepped forms. */
  isFirstStep: boolean
  /** True on the final step or on non-stepped forms. */
  isLastStep: boolean
}

/**
 * Shared Nuxt UI button presentation for built-in and custom form actions.
 */
export interface FormActionUi {
  /** Button label. Defaults are provided for built-in action keys. */
  label?: FormText
  /** Leading icon name. Set to `false` to suppress built-in icons. */
  icon?: string | false
  /** Trailing icon name. */
  trailingIcon?: string | false
  /** Shared-ui action emphasis. `primary` maps to Nuxt UI's primary solid button. */
  type?: FormActionType
  /** Nuxt UI button color. */
  color?: FormActionColor
  /** Nuxt UI button variant. */
  variant?: FormActionVariant
  /** Nuxt UI button size. */
  size?: FormActionSize
  /** Responsive action slot. `left` and `right` map to the two footer groups. */
  slot?: FormActionSlot
  /** Responsive width. `fill` makes the action flex within its slot. */
  width?: FormActionWidth
  /** Additional class forwarded to the button. */
  class?: string
  /** Controls whether the action is rendered. */
  condition?: (params: FormActionContext) => boolean
  /** Controls whether the action is disabled. */
  disabled?: (params: FormActionContext) => boolean
}

/**
 * Built-in form action. The runtime owns the behavior for the action key.
 */
export interface BaseFormAction extends FormActionUi {
  key: FormActionKey
}

/**
 * Custom form action. Use this for side effects, custom navigation, or external links.
 */
export interface CustomFormAction extends FormActionUi {
  key?: string
  link?: string | ((params: FormActionContext) => string)
  action?: (params: FormActionContext) => Promise<void> | void
}

export type FormAction = BaseFormAction | CustomFormAction
