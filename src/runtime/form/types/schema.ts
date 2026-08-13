import type { FormAction } from './actions'
import type { FormApi, FormSubmitHandler } from './api'
import type { FormContextData, FormContextDefinition } from './context'
import type { FormField, FormFieldType } from './field'
import type { FormLayoutConfig } from './layout'
import type { FormUiConfig } from './ui'
import type { FormMaybePromise, FormObject, FormText } from './utils'
import type { FormValidationMode } from './validation'

export interface FormDirtyNavigationConfig {
  message?: FormText
  ignorePaths?: readonly string[]
}

export interface FormControlsConfig {
  /** Enables dirty metadata and field reset affordances. */
  dirtyCheck?: boolean
  /** Focuses the first field after mount, or a specific raw field path. */
  autoFocus?: boolean | string
  /** Warns before an inline dirty form is closed or navigated away from. */
  confirmNavOnDirty?: boolean | FormDirtyNavigationConfig
  /** Keeps external input changes synchronized after the initial mount. */
  syncInput?: boolean | readonly string[]
  /** Selects required, custom-rule, all, or no validation. */
  validate?: FormValidationMode
}

export interface FormModalConfig {
  maxWidth?: number | string
  maxHeight?: number | string
  allowOutsideClick?: boolean
  showCloseButton?: boolean
}

export interface FormDrawerConfig {
  placement?: 'left' | 'right' | 'top' | 'bottom'
  allowOutsideClick?: boolean
  showCloseButton?: boolean
  resizable?: boolean
  width?: number | string
  height?: number | string
}

export interface FormFullscreenConfig {
  allowOutsideClick?: boolean
  showCloseButton?: boolean
}

export interface FormStepLifecycleParams<TOutput = FormObject> {
  /** Step summary targeted by the lifecycle callback. */
  step: FormStep
  /** Zero-based step index targeted by the lifecycle callback. */
  stepIndex: number
  /** Current submitted output. */
  formData: TOutput
  /** Current submitted output, kept for shared-ui parity and future step-scoped narrowing. */
  stepData: TOutput
  /** Public form API for validation, focus, state, submit, and reset. */
  api: FormApi
}

/**
 * Step in a multi-step form schema.
 */
export interface FormStep<
  TContext = {},
  TFields extends readonly FormField<TContext>[] = readonly FormField<TContext>[],
> {
  /** Stable step key used by navigation state and test selectors. */
  key?: string
  /** Optional title rendered by stepper-aware layouts. */
  title?: FormText
  /** Optional supporting copy rendered by stepper-aware layouts. */
  description?: FormText
  /** Optional icon name rendered by stepper-aware layouts. */
  icon?: string
  /** Optional output root. Fields inside the step are submitted below this path. */
  root?: string
  /** Step-level layout override. */
  layout?: FormLayoutConfig
  /** Step-level action override. Falls back to schema actions, then built-in actions. */
  actions?: readonly FormAction[]
  /** Fields rendered for this step. */
  fields: TFields
}

/**
 * Schema accepted by `defineFormSchema`.
 */
export interface FormSchema<
  TContext extends FormContextDefinition | undefined = FormContextDefinition | undefined,
  TFields extends readonly FormField<FormContextData<TContext>>[] = readonly FormField<
    FormContextData<TContext>
  >[],
  TSteps extends readonly FormStep<FormContextData<TContext>>[] = readonly FormStep<
    FormContextData<TContext>
  >[],
> {
  /** Stable key used by persistence, diagnostics, and test selectors. */
  formKey?: string
  /** Optional user-facing title for full-form renderers. */
  title?: FormText
  /** Form-scoped data sources exposed to fields as `ctx`. */
  context?: TContext
  /** Form-level field grid layout. */
  layout?: FormLayoutConfig
  /** Form-scoped presentation overrides, merged after app defaults. */
  ui?: FormUiConfig
  /** Fields rendered and managed by the form runtime. */
  fields?: TFields
  /** Steps rendered and managed by stepper-aware form layouts. */
  steps?: TSteps
  /** Controls whether the default stepper chrome is rendered for stepped schemas. */
  showStepper?: boolean
  /** Runtime lifecycle and validation controls. */
  controls?: FormControlsConfig
  /** Modal-shell sizing and dismissal behavior. */
  modal?: FormModalConfig
  /** Drawer-shell placement, sizing, and dismissal behavior. */
  drawer?: FormDrawerConfig
  /** Fullscreen-shell dismissal behavior. */
  fullscreen?: FormFullscreenConfig
  /** Form action configuration. Omit to use built-in reset/submit or previous/next/submit actions. */
  actions?: readonly FormAction[]
  /** Runs after validation and before the external submit handler. Return `false` to cancel submit. */
  onBeforeSubmit?: FormSubmitHandler<unknown, never>
  /** Submit lifecycle hook. */
  submit?: (params: {
    value: unknown
    api: FormApi
    ctx: FormContextData<TContext>
  }) => Promise<void> | void
  /** Runs after current-step validation and before advancing to the next step. Return `false` to stop navigation. */
  onBeforeNext?: (params: FormStepLifecycleParams<unknown>) => FormMaybePromise<boolean | void>
  /** Runs before moving to the previous step. */
  onBeforePrevious?: (params: FormStepLifecycleParams<unknown>) => FormMaybePromise<void>
  /** Returns true when a step should be skipped during previous/next navigation. */
  skipStep?: (params: FormStepLifecycleParams<unknown>) => boolean
  /** Runs when `skipStep` skips a step. */
  onStepSkipped?: (params: Omit<FormStepLifecycleParams<unknown>, 'stepData'>) => void
}

/**
 * Extracts the typed context object exposed by a form schema.
 */
export type ExtractFormContext<TSchema> = TSchema extends {
  readonly context?: infer TContext extends FormContextDefinition | undefined
}
  ? FormContextData<TContext>
  : {}

/**
 * Extracts the authored fields from a form schema.
 */
export type ExtractFormFields<TSchema> = TSchema extends { readonly fields: infer TFields }
  ? TFields
  : TSchema extends { readonly steps: infer TSteps }
    ? TSteps extends readonly { readonly fields: infer TFields }[]
      ? TFields
      : readonly FormField[]
    : readonly FormField[]

/**
 * Extracts the authored steps from a form schema.
 */
export type ExtractFormSteps<TSchema> = TSchema extends { readonly steps: infer TSteps }
  ? TSteps
  : readonly FormStep[]

type FormFieldByType<TType extends FormFieldType, TContext> = Extract<
  FormField<TContext>,
  { type: TType }
>

type NoExtraFieldProperties<TField, TExpected> =
  Exclude<keyof TField, keyof TExpected> extends never ? TField : never

/**
 * Strict authored field shape used by schema helpers.
 */
export type StrictFormField<TField, TContext = {}> = TField extends { type: infer TType }
  ? TType extends FormFieldType
    ? NoExtraFieldProperties<TField, FormFieldByType<TType, TContext>>
    : never
  : never

/**
 * Strict authored field collection used by schema helpers.
 */
export type StrictFormFields<TFields extends readonly { type: FormFieldType }[], TContext = {}> = {
  readonly [TKey in keyof TFields]: StrictFormField<TFields[TKey], TContext>
}
