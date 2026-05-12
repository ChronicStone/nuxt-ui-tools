import type { FormApi, FormSubmitHandler } from './api'
import type { FormContextData, FormContextDefinition } from './context'
import type { FormField, FormFieldType } from './field'
import type { FormLayoutConfig } from './layout'
import type { FormText } from './utils'

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
  /** Fields rendered for this step. */
  fields: TFields
}

/**
 * Schema accepted by `defineFormSchema`.
 */
export interface FormSchema<
  TContext extends FormContextDefinition | undefined = FormContextDefinition | undefined,
  TFields extends readonly FormField<FormContextData<TContext>>[] = readonly FormField<FormContextData<TContext>>[],
  TSteps extends readonly FormStep<FormContextData<TContext>>[] = readonly FormStep<FormContextData<TContext>>[],
> {
  /** Stable key used by persistence, diagnostics, and test selectors. */
  formKey?: string
  /** Optional user-facing title for full-form renderers. */
  title?: FormText
  /** Form-scoped data sources exposed to fields as `ctx`. */
  context?: TContext
  /** Form-level field grid layout. */
  layout?: FormLayoutConfig
  /** Fields rendered and managed by the form runtime. */
  fields?: TFields
  /** Steps rendered and managed by stepper-aware form layouts. */
  steps?: TSteps
  /** Controls whether the default stepper chrome is rendered for stepped schemas. */
  showStepper?: boolean
  /** Runs after validation and before the external submit handler. Return `false` to cancel submit. */
  onBeforeSubmit?: FormSubmitHandler<unknown, never>
  /** Submit lifecycle hook. */
  submit?: (params: { value: unknown, api: FormApi, ctx: FormContextData<TContext> }) => Promise<void> | void
}

/**
 * Extracts the typed context object exposed by a form schema.
 */
export type ExtractFormContext<TSchema> = TSchema extends { readonly context?: infer TContext extends FormContextDefinition | undefined }
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

type NoExtraFieldProperties<TField, TExpected> = Exclude<keyof TField, keyof TExpected> extends never
  ? TField
  : never

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
