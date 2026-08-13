import type { FormFieldCallback } from './callbacks'
import type { FormMaybePromise, FormText } from './utils'

/**
 * Result returned by a form validation rule.
 */
export type FormValidationResult = boolean | string | null | undefined

/**
 * A single validation rule.
 */
export interface FormValidationRule<TValue = unknown, TContext = {}, TDeps = {}> {
  /** Stable rule name used for debugging, i18n, and external error mapping. */
  name: string
  /** Returns true for valid values, false/string for invalid values. */
  validate: FormFieldCallback<FormMaybePromise<FormValidationResult>, TContext, TDeps, TValue>
  /** Default message used when `validate` returns false. */
  message?: FormText
}

/**
 * Controls when a field starts running validation while the user edits it.
 *
 * - `blur`: default Vuelidate-style behavior. The first edit stays quiet, the first blur
 *   marks the field as validation-dirty, and later edits validate live.
 * - `input`: validates as soon as the value changes.
 * - `submit`: only validates through explicit form/step submit validation.
 */
export type FormValidationTrigger = 'blur' | 'input' | 'submit'

/** Selects which authored validation layers are evaluated. */
export type FormValidationMode = boolean | 'required' | 'rules'

/**
 * Concrete validation error stored by the form runtime.
 */
export interface FormValidationError {
  /** Raw field path. */
  path: string
  /** Resolved message safe to display in the UI. */
  message: string
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
export interface FormValidationConfig<TValue = unknown, TContext = {}, TDeps = {}> {
  /** Defines when the field starts showing validation feedback while editing. */
  trigger?: FormValidationTrigger
  /** Marks the field as required. */
  required?: boolean | FormFieldCallback<boolean, TContext, TDeps, TValue>
  /** Message used by the default required rule. */
  requiredMessage?: FormText
  /** Additional field rules. */
  rules?: readonly FormValidationRule<TValue, TContext, TDeps>[]
}
