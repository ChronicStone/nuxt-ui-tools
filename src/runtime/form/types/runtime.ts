import type { ComputedRef, Ref } from 'vue'

import type { FormFieldApi } from './api'
import type { FormSubmitAction, FormSubmitHandler, FormSubmitHandlerResult } from './api'
import type { FormFieldCallbackParams } from './callbacks'
import type { FormRuntimeContext } from './context'
import type { FormField } from './field'
import type { FormFocusRequest } from './focus'
import type { FormLayoutConfig } from './layout'
import type { FormOptionRuntimeState } from './options-runtime'
import type { FormObject } from './utils'
import type { FormValidationError, FormValidationOptions } from './validation'

/**
 * Parameters used to create the internal form runtime consumed by `<NutForm>`.
 */
export interface UseFormRuntimeParams {
  /** Authored schema currently rendered by the form. */
  schema: ComputedRef<unknown>
  /** Optional initial internal state provided by a controller or direct form usage. */
  input?: ComputedRef<FormObject | undefined>
}

/**
 * Normalized step summary exposed by runtime and controller navigation APIs.
 */
export interface FormRuntimeStep {
  /** Stable step key, falling back to its 1-based index. */
  key: string
  /** Resolved label rendered by step controls. */
  label: string
  /** True when this step is the current rendered step. */
  active: boolean
  /** Zero-based step index. */
  index: number
  /** Optional root path applied to fields inside this step. */
  root?: string
}

/**
 * Internal runtime object provided to form renderers and field components.
 *
 * This is intentionally broader than the public `useForm` controller: renderers need field
 * registration, touched-state, option registry, and callback factories that should not be
 * exposed as top-level consumer API without deliberate design.
 */
export interface FormRuntime {
  schema: ComputedRef<unknown>
  state: FormObject
  output: ComputedRef<FormObject>
  dirtyPaths: ComputedRef<readonly string[]>
  isDirty: ComputedRef<boolean>
  errors: ComputedRef<readonly FormValidationError[]>
  context: FormRuntimeContext
  actionPending: ComputedRef<FormSubmitAction | null>
  currentStepIndex: Ref<number>
  currentFields: ComputedRef<readonly FormField[]>
  currentStepRoot: ComputedRef<string | undefined>
  currentLayout: ComputedRef<FormLayoutConfig>
  currentStep: ComputedRef<FormRuntimeStep | null>
  steps: ComputedRef<readonly FormRuntimeStep[]>
  isStepped: ComputedRef<boolean>
  isFirstStep: ComputedRef<boolean>
  isLastStep: ComputedRef<boolean>
  canGoPrevious: ComputedRef<boolean>
  canGoNext: ComputedRef<boolean>
  getValue: (path: string | readonly string[]) => unknown
  setValue: (path: string | readonly string[], value: unknown) => void
  getFieldApi: (path: readonly string[], field?: FormField) => FormFieldApi
  getFieldCallbackParams: (path: readonly string[], field: FormField) => FormFieldCallbackParams
  registerFieldOptions: (path: readonly string[], state: FormOptionRuntimeState) => () => void
  refreshFieldOptions: (paths: readonly (string | readonly string[])[]) => Promise<void>
  getFieldError: (path: readonly string[]) => string | undefined
  markFieldTouched: (path: readonly string[]) => void
  isFieldTouched: (path: readonly string[]) => boolean
  shouldRender: (field: FormField, path: readonly string[]) => boolean
  validate: (options?: FormValidationOptions) => Promise<boolean>
  validateCurrentStep: (options?: FormValidationOptions) => Promise<boolean>
  focusRequest: Ref<FormFocusRequest | null>
  registerFieldElement: (path: string | readonly string[], element: HTMLElement) => () => void
  focusField: (path: string | readonly string[]) => Promise<boolean>
  focusFirstInvalid: () => Promise<boolean>
  clearErrors: () => void
  submitHandler: (submitHandler?: FormSubmitHandler<FormObject>) => Promise<FormSubmitHandlerResult>
  submit: () => Promise<boolean>
  reset: () => void
  nextStep: () => Promise<boolean>
  previousStep: () => Promise<boolean>
  goToStep: (index: number) => Promise<boolean>
}
