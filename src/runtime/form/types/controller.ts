import type { ComputedRef, MaybeRefOrGetter } from 'vue'
import type { ExtractFormContext } from './schema'
import type { ExtractFormInternalValue, ExtractFormOutput } from './output'
import type { FormObject } from './utils'
import type {
  FormSubmitAction,
  FormSubmitHandler,
  FormSubmitHandlerResult,
  FormSubmitTarget,
} from './api'
import type { FormValidationError } from './validation'
import type { FormRuntime, FormRuntimeStep } from './runtime'

/**
 * Options accepted by `useForm`.
 *
 * `useForm` is the preferred high-level action API for rendered forms. It owns the schema,
 * keeps the rendered `<NutForm>` bound to the same typed controller, and exposes values,
 * validation, submission, and step navigation without template ref plumbing.
 *
 * @example
 * ```ts
 * const form = useForm({
 *   schema: accountForm,
 *   onSubmit: ({ formData }) => saveAccount(formData),
 * })
 * ```
 */
export interface UseFormParams<TSchema, TSubmitData = unknown> {
  /** Schema owned by this form controller and passed to `<NutForm :form="form" />`. */
  schema: MaybeRefOrGetter<TSchema>
  /** Optional initial internal state. Dotted field keys are still normalized by the runtime. */
  input?: MaybeRefOrGetter<FormObject | undefined>
  /** Optional default submit handler used by `form.submit()` and native form submit. */
  onSubmit?: FormSubmitHandler<ExtractFormOutput<TSchema>, TSubmitData>
}

/**
 * Untyped runtime overload used internally once the authored schema has crossed the
 * Vue runtime boundary.
 */
export interface RuntimeUseFormParams {
  schema: MaybeRefOrGetter<unknown>
  input?: MaybeRefOrGetter<FormObject | undefined>
  onSubmit?: FormSubmitHandler<FormObject, unknown>
}

export interface FormControllerState<TInternal = FormObject, TOutput = FormObject> {
  /** Current internal form state before output transforms and omitted submit fields. */
  internal: ComputedRef<TInternal>
  /** Current submitted output after transforms, step roots, and omissions. */
  output: ComputedRef<TOutput>
  /** Reads an internal form value by raw path. Dotted paths address nested state. */
  get: (path: string) => unknown
  /** Writes an internal form value by raw path. Dotted paths create nested state. */
  set: (path: string, value: unknown) => void
  /** Resets internal state to schema defaults and configured input. */
  reset: () => void
}

export interface FormControllerMeta {
  /** True once a rendered `<NutForm>` is mounted and bound to this controller. */
  isBound: ComputedRef<boolean>
  /** Dirty state derived from the initial state snapshot. */
  isDirty: ComputedRef<boolean>
  /** Dirty internal paths derived from the initial state snapshot. */
  dirtyPaths: ComputedRef<readonly string[]>
}

export interface FormControllerValidation {
  /** Current validation errors produced by live, step, or submit validation. */
  errors: ComputedRef<readonly FormValidationError[]>
  /** True when the current validation result contains at least one error. */
  hasErrors: ComputedRef<boolean>
  /** True when the current validation result has no errors. */
  isValid: ComputedRef<boolean>
  /** Runs whole-form validation and marks invalid paths as touched. */
  validate: () => Promise<boolean>
  /** Runs validation for the currently visible step or field collection. */
  validateCurrentStep: () => Promise<boolean>
  /** Reads the current error message for a raw path. */
  getError: (path: string) => string | undefined
  /** Clears all current validation and external errors. */
  clear: () => void
}

export interface FormControllerSubmission<TOutput = FormObject, TSubmitData = unknown> {
  /** Current pending submit/navigation action. */
  actionPending: ComputedRef<FormSubmitAction | null>
  /** True while the form submit lifecycle is pending. */
  isSubmitting: ComputedRef<boolean>
  /** Runs the default or provided submit handler through the form lifecycle. */
  submit: (submitHandler?: FormSubmitHandler<TOutput, TSubmitData>) => Promise<boolean>
  /** Runs the submit lifecycle and returns the normalized submit result. */
  submitHandler: (
    submitHandler?: FormSubmitHandler<TOutput, TSubmitData>
  ) => Promise<FormSubmitHandlerResult<TSubmitData>>
}

export interface FormControllerNavigation {
  /** Current step index. */
  currentStepIndex: ComputedRef<number>
  /** Current step summary, or `null` when the schema is not stepped. */
  currentStep: ComputedRef<FormRuntimeStep | null>
  /** Current step summaries. */
  steps: ComputedRef<readonly FormRuntimeStep[]>
  /** True when the schema has steps. */
  isStepped: ComputedRef<boolean>
  /** True on the first step or on non-stepped forms. */
  isFirstStep: ComputedRef<boolean>
  /** True on the final step or on non-stepped forms. */
  isLastStep: ComputedRef<boolean>
  /** True when moving to a previous step is currently meaningful. */
  canGoPrevious: ComputedRef<boolean>
  /** True when moving to a next step is currently meaningful. */
  canGoNext: ComputedRef<boolean>
  /** Moves to the next step after validating the current step. */
  next: () => Promise<boolean>
  /** Moves to the previous step. */
  previous: () => boolean
  /** Moves to a step index. Forward moves validate the current step first. */
  goTo: (index: number) => Promise<boolean>
}

/**
 * Minimal controller shape consumed by the rendered form component.
 *
 * This keeps `<NutForm :form="form" />` assignable for every schema-specific controller
 * without forcing the component prop to know the controller's submitted output type.
 */
export interface FormRendererController {
  /** Schema bound to the controller. */
  schema: ComputedRef<unknown>
  /** Initial input state bound to the controller. */
  input: ComputedRef<FormObject | undefined>
  /** Runs the controller's default submit lifecycle. */
  submit: () => Promise<boolean>
  /** Binds a mounted runtime instance to the controller. */
  bind: (runtime: FormRuntime) => void
  /** Unbinds a mounted runtime instance from the controller. */
  unbind: (runtime: FormRuntime) => void
}

/**
 * Typed form controller returned by `useForm`.
 *
 * Pass the controller to `<NutForm :form="form" />` and use the namespaces here for
 * state inspection, autosave flows, custom action bars, wizard navigation, and explicit
 * submit handling.
 */
export interface FormController<TSchema = FormObject, TSubmitData = unknown>
  extends FormSubmitTarget<ExtractFormOutput<TSchema>, TSubmitData>, FormRendererController {
  /** Schema bound to this controller. */
  schema: ComputedRef<TSchema>
  /** Initial input state bound to this controller. */
  input: ComputedRef<FormObject | undefined>
  /** Form-scoped context resources declared on the schema. */
  context: ComputedRef<ExtractFormContext<TSchema>>
  /** Value namespace for internal/output state and raw path operations. */
  state: FormControllerState<ExtractFormInternalValue<TSchema>, ExtractFormOutput<TSchema>>
  /** Dirty and binding metadata. */
  meta: FormControllerMeta
  /** Validation namespace. */
  validation: FormControllerValidation
  /** Submission namespace. */
  submission: FormControllerSubmission<ExtractFormOutput<TSchema>, TSubmitData>
  /** Step navigation namespace. */
  navigation: FormControllerNavigation
  /** Ergonomic alias for `form.state.internal`. */
  internal: ComputedRef<ExtractFormInternalValue<TSchema>>
  /** Ergonomic alias for `form.state.output`. */
  output: ComputedRef<ExtractFormOutput<TSchema>>
  /** Ergonomic alias for `form.validation.errors`. */
  errors: ComputedRef<readonly FormValidationError[]>
  /** Ergonomic alias for `form.meta.isDirty`. */
  isDirty: ComputedRef<boolean>
  /** Ergonomic alias for `form.meta.dirtyPaths`. */
  dirtyPaths: ComputedRef<readonly string[]>
  /** Ergonomic alias for `form.submission.isSubmitting`. */
  isSubmitting: ComputedRef<boolean>
  /** Ergonomic alias for `form.submission.actionPending`. */
  actionPending: ComputedRef<FormSubmitAction | null>
  /** Ergonomic alias for `form.validation.validate`. */
  validate: () => Promise<boolean>
  /** Ergonomic alias for `form.submission.submit`. */
  submit: (submitHandler?: FormSubmitHandler<ExtractFormOutput<TSchema>, TSubmitData>) => Promise<boolean>
  /** Ergonomic alias for `form.submission.submitHandler`. */
  submitHandler: (
    submitHandler?: FormSubmitHandler<ExtractFormOutput<TSchema>, TSubmitData>
  ) => Promise<FormSubmitHandlerResult<TSubmitData>>
  /** Ergonomic alias for `form.state.reset`. */
  reset: () => void
  /** Ergonomic alias for `form.navigation.next`. */
  nextStep: () => Promise<boolean>
  /** Ergonomic alias for `form.navigation.previous`. */
  previousStep: () => boolean
  /** Internal renderer binding used by `<NutForm :form="form" />`. */
  bind: (runtime: FormRuntime) => void
  /** Internal renderer unbinding used when the form component unmounts. */
  unbind: (runtime: FormRuntime) => void
}
