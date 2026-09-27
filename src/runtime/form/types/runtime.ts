import type { ComputedRef, Ref } from 'vue'

import type { FormValue } from './'
import type {
  FormErrorOptions,
  FormFieldApi,
  FormSubmitAction,
  FormSubmitHandler,
  FormSubmitHandlerResult,
} from './api'
import type { FormFieldCallbackParams } from './callbacks'
import type { FormRuntimeContext } from './context'
import type { FormField } from './field'
import type { FormFocusRequest } from './focus'
import type { FormLayoutConfig } from './layout'
import type { FormOptionRuntimeState } from './options-runtime'
import type { FormUploadRuntimeState } from './upload-runtime'
import type { FormObject } from './utils'
import type { FormValidationError, FormValidationMode, FormValidationOptions } from './validation'

/**
 * Parameters used to create the internal form runtime consumed by `<NutForm>`.
 */
export interface UseFormRuntimeParams {
  /** Authored schema currently rendered by the form. */
  schema: ComputedRef<FormValue>
  /** Optional initial internal state provided by a controller or direct form usage. */
  input?: ComputedRef<FormObject | undefined>
  syncInput?: ComputedRef<boolean | readonly string[]>
  validationMode?: ComputedRef<FormValidationMode>
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
/**
 * Spreads the render of a large form over frames. See `createFormRenderScheduler`.
 */
export interface FormRenderScheduler {
  /** True once the form has painted its first frame. */
  painted: Readonly<Ref<boolean>>
  /**
   * A render slot: true at once within the frame weight of an idle scheduler, later otherwise.
   * `top` gives the top edge of the slot's placeholder on screen, or `undefined` while it has
   * none, so a slot on screen renders before the first paint.
   */
  claim: (weight?: number, top?: () => number | undefined) => Ref<boolean>
  /** Grants every pending slot now, and the slots they claim in this frame. */
  flush: () => void
  /** Runs `task` once the form has painted, in the caller's effect scope. */
  afterPaint: (task: () => void) => void
  /** Called when the form mounts; the first paint follows. */
  start: () => void
}

export interface FormRuntime {
  schema: ComputedRef<FormValue>
  render: FormRenderScheduler
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
  getValue: (path: string | readonly string[]) => FormValue
  getInitialValue: (path: string | readonly string[]) => FormValue
  trackEffect: (effect: FormValue) => void
  settleEffects: () => Promise<void>
  setValue: (path: string | readonly string[], value: FormValue) => void
  getFieldApi: (path: readonly string[], field?: FormField) => FormFieldApi
  getFieldCallbackParams: (path: readonly string[], field: FormField) => FormFieldCallbackParams
  registerFieldOptions: (path: readonly string[], state: FormOptionRuntimeState) => () => void
  registerFieldUpload: (path: readonly string[], state: FormUploadRuntimeState) => () => void
  refreshFieldOptions: (paths: readonly (string | readonly string[])[]) => Promise<void>
  getFieldError: (path: readonly string[]) => string | undefined
  markFieldTouched: (path: readonly string[]) => void
  isFieldTouched: (path: readonly string[]) => boolean
  shouldRender: (field: FormField, path: readonly string[]) => boolean
  validate: (options?: FormValidationOptions) => Promise<boolean>
  validateCurrentStep: (options?: FormValidationOptions) => Promise<boolean>
  setError: (path: string | readonly string[], message: string, options?: FormErrorOptions) => void
  clearError: (path?: string | readonly string[]) => void
  focusRequest: Ref<FormFocusRequest | null>
  registerFieldElement: (path: string | readonly string[], element: HTMLElement) => () => void
  focusField: (path: string | readonly string[]) => Promise<boolean>
  focusFirstInvalid: () => Promise<boolean>
  /** Clears every error, or only those of these dotted paths and what they contain, at once. */
  clearErrors: (paths?: readonly string[]) => void
  submitHandler: (submitHandler?: FormSubmitHandler<FormObject>) => Promise<FormSubmitHandlerResult>
  submit: () => Promise<boolean>
  reset: () => Promise<void>
  nextStep: () => Promise<boolean>
  previousStep: () => Promise<boolean>
  goToStep: (index: number) => Promise<boolean>
}
