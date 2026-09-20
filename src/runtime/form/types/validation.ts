import type { RegleRuleRaw } from '@regle/core'

import type { FormValue } from './'
import type { FormFieldCallback } from './callbacks'
import type { FormObject, FormText } from './utils'

/**
 * Controls when a field starts running validation while the user edits it.
 *
 * - `blur`: default Vuelidate-style behavior. The first edit stays quiet, the first blur
 *   marks the field as validation-dirty, and later edits validate live.
 * - `input`: validates as soon as the value changes.
 * - `submit`: only validates through explicit form/step submit validation.
 */
export type FormValidationTrigger = 'blur' | 'input' | 'submit'

/** Selects which native Regle validation layers are evaluated. */
export type FormValidationMode = boolean | 'required' | 'validators'

/**
 * Concrete validation error stored by the form runtime.
 */
export interface FormValidationError {
  /** Raw field path. */
  path: string
  /** Resolved message safe to display in the UI. */
  message: string
  /** External errors only block submit when set with `blocking: true`. */
  blocking?: boolean
}

/**
 * Options accepted by form-level validation calls.
 */
export interface FormValidationOptions {
  /**
   * Focuses the first focusable invalid field after validation fails.
   *
   * @example
   * ```ts
   * await form.validate({ focus: true })
   * ```
   */
  focus?: boolean
}

/**
 * Field validation configuration.
 */
export interface FormValidationConfig<
  TValue = FormValue,
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> {
  /** Defines when the field starts showing validation feedback while editing. */
  trigger?: FormValidationTrigger
  /** Marks the field as required. */
  required?: boolean | FormFieldCallback<boolean, TContext, TDeps, TValue>
  /** Message used by the default required rule. */
  requiredMessage?: FormText
}

/** Native Regle rules keyed by their validation name. */
export type FormValidators = Record<string, RegleRuleRaw>

/** Static or dependency-aware native Regle rules for one field. */
export type FormValidatorsConfig<TContext = NonNullable<unknown>> =
  | FormValidators
  | FormFieldCallback<FormValidators, TContext, FormObject>
