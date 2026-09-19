import type { ComputedRef } from 'vue'

import type { NestedPaths } from '../../shared/types/utils'
import type { FormValue } from './'
import type { FormContextData } from './context'
import type { FormMaybePromise, FormObject } from './utils'
import type { FormValidationOptions } from './validation'

export type FormRefreshableContextKey<TContext> = {
  [TKey in keyof TContext]: Extract<TContext[TKey], { refresh: () => Promise<void> }> extends never
    ? never
    : TKey
}[keyof TContext] &
  string

export type FormContextResourceValue<TResource> = TResource extends { value: infer TValue }
  ? TValue
  : FormValue

export type FormPatchableContextKey<TContext> = {
  [TKey in keyof TContext]: NonNullable<
    FormContextResourceValue<TContext[TKey]>
  > extends readonly FormValue[]
    ? never
    : NonNullable<FormContextResourceValue<TContext[TKey]>> extends object
      ? TKey
      : never
}[keyof TContext] &
  string

export type FormContextPatchValue<TContext, TKey extends keyof TContext> = Partial<
  NonNullable<FormContextResourceValue<TContext[TKey]>>
>

export interface FormErrorOptions {
  /** Blocks submit and step navigation while the error is present. Defaults to `true`. */
  blocking?: boolean
}

/**
 * Public value namespace exposed to a mounted field.
 */
export interface FormFieldValueApi<TValue = FormValue> {
  /** Reads the current internal field value. */
  get: () => TValue
  /** Updates the current internal field value. */
  set: (value: TValue) => void
  /** Reads the baseline value captured when the form was initialized or last reset. */
  initial: () => TValue
  /** Resets the current internal field value to its configured default. */
  reset: () => void
}

/**
 * Form-wide operations exposed to a mounted field. Paths are absolute, or relative with
 * `$parent` / `$parent:N` / `$root`, resolved against the owning field's scope.
 */
export interface FormFieldFormApi {
  /** Reads an internal form value. */
  get: (path: string) => FormValue
  /** Writes an internal form value. */
  set: (path: string, value: FormValue) => void
  /** Reads a baseline value captured when the form was initialized or last reset. */
  initial: (path: string) => FormValue
  /** Reads the whole internal form state. */
  state: () => FormObject
  /** Reads the current submitted output. */
  output: () => FormObject
  /** Focuses a mounted field. */
  focus: (path: string) => Promise<boolean>
  /** Sets an external error on a field. */
  setError: (path: string, message: string, options?: FormErrorOptions) => void
  /** Clears one external field error, or every form error when no path is provided. */
  clearError: (path?: string) => void
  /** Runs whole-form validation. */
  validate: () => Promise<boolean>
  /** Resets the form and waits for dependency effects triggered by the reset. */
  reset: () => Promise<void>
  /** Submits the form through the configured submit lifecycle. */
  submit: () => Promise<boolean>
  /** Advances to the next step on stepped forms. */
  nextStep: () => Promise<boolean>
  /** Returns to the previous step on stepped forms. */
  previousStep: () => Promise<boolean>
}

/**
 * Public option namespace exposed to option-based fields.
 */
export interface FormFieldOptionsApi<TOption = FormValue> {
  /** Returns the current resolved options. */
  get: () => readonly TOption[]
  /** Adds a local option to the mounted field without calling the async create handler. */
  add: (option: TOption) => void
  /** True while the first option value is loading. */
  pending: () => boolean
  /** True while options are refreshing after usable data already exists. */
  fetching: () => boolean
  /** True when options should render a visible loader. */
  loading: () => boolean
  /** True while an option creation handler is pending. */
  creating: () => boolean
  /** True when the option field configured a refresh affordance. */
  refreshable: () => boolean
  /** Returns the latest option-source error, if any. */
  error: () => FormValue | null
  /** Refreshes the option source when it is async or query-backed. */
  refresh: () => Promise<void>
  /** Creates a new option when the field configured an option creation handler. */
  create: (label: string) => Promise<TOption | null>
  /** Returns hydrated options for the current selection, including values outside loaded pages. */
  selected: () => readonly TOption[]
  /** True when the field loads options remotely. */
  remote: () => boolean
  /** Current remote search term. */
  search: () => string
  /** Sets the remote search term. Ignored for local option sources. */
  setSearch: (term: string) => void
  /** Starts remote loading, for example when the menu opens. */
  activate: () => void
  /** True when another remote page can be loaded. */
  hasMore: () => boolean
  /** Loads the next remote page. */
  loadMore: () => Promise<void>
  /** Retries the last failed remote request. */
  retry: () => Promise<void>
}

/**
 * Public upload namespace exposed to upload fields.
 */
export interface FormFieldUploadApi<TValue = FormValue> {
  /** Starts or restarts upload work for the current selected file value. */
  start: () => Promise<void>
  /** Cancels upload work when the current upload source supports cancellation. */
  cancel: () => Promise<void>
  /** Retries the last failed upload. */
  retry: () => Promise<void>
  /** Removes the current uploaded value and runs delete lifecycle hooks when configured. */
  remove: (value?: TValue) => Promise<void>
}

/**
 * Public validation namespace exposed to a mounted field.
 */
export interface FormFieldValidationApi {
  /** Runs validation for the current field. */
  validate: () => Promise<boolean>
  /** True while an asynchronous Regle rule for this field is running. */
  pending: () => boolean
  /** Sets an external field error. Blocking by default. */
  setError: (message: string, options?: FormErrorOptions) => void
  /** Clears external field errors. */
  clearError: () => void
}

/**
 * Public context namespace exposed to a mounted field.
 */
export interface FormFieldContextApi<TContext = FormContextData> {
  /** Reads a form-scoped context resource by key. */
  get: <TKey extends keyof TContext & string>(key: TKey) => TContext[TKey]
  /** Replaces the current value of a form-scoped context resource. */
  set: <TKey extends keyof TContext & string>(
    key: TKey,
    value: FormContextResourceValue<TContext[TKey]>,
  ) => void
  /** Updates the current value of a form-scoped context resource from its previous value. */
  update: <TKey extends keyof TContext & string>(
    key: TKey,
    updater: (
      value: FormContextResourceValue<TContext[TKey]>,
    ) => FormContextResourceValue<TContext[TKey]>,
  ) => void
  /** Shallow-patches object context values. Arrays and primitives should use `set` or `update`. */
  patch: <TKey extends FormPatchableContextKey<TContext>>(
    key: TKey,
    value:
      | FormContextPatchValue<TContext, TKey>
      | ((
          value: NonNullable<FormContextResourceValue<TContext[TKey]>>,
        ) => FormContextPatchValue<TContext, TKey>),
  ) => void
  /** Refreshes an async form-scoped context resource by key. */
  refresh: <TKey extends FormRefreshableContextKey<TContext>>(key: TKey) => Promise<void>
  /** Refreshes every async form-scoped context resource declared by the schema. */
  refreshAll: () => Promise<void>
}

/**
 * Public field API available from field callbacks.
 */
export interface FormFieldApi<TValue = FormValue, TOption = FormValue, TContext = FormContextData> {
  /** Field-local value operations. */
  value: FormFieldValueApi<TValue>
  /** Form-wide value, error, focus, and lifecycle operations. */
  form: FormFieldFormApi
  /** Form-scoped context operations. */
  context: FormFieldContextApi<TContext>
  /** Option operations. Present for all fields at type level only where the field supports options. */
  options: FormFieldOptionsApi<TOption>
  /** Upload operations. Present for upload fields. */
  upload: FormFieldUploadApi<TValue>
  /** Validation operations for the field. */
  validation: FormFieldValidationApi
  /** Focuses the mounted control for this field when it has a focusable input. */
  focus: () => Promise<boolean>
}

/**
 * Public form API available from form-level callbacks.
 */
export type FormFieldPath<TOutput = FormObject> = TOutput extends FormObject
  ? FormObject extends TOutput
    ? string
    : NestedPaths<TOutput>
  : string

export interface FormApi<TOutput = FormObject> {
  /** Reads an internal form value by raw path. */
  get: (path: string) => FormValue
  /** Writes an internal form value by raw path. */
  set: (path: string, value: FormValue) => void
  /** Reads a baseline value by raw path. */
  initial: (path: string) => FormValue
  /** Runs form validation. */
  validate: (options?: FormValidationOptions) => Promise<boolean>
  /** Sets an external error on a submitted output field. Blocking by default. */
  setError: (path: FormFieldPath<TOutput>, message: string, options?: FormErrorOptions) => void
  /** Clears one external field error, or every form error when no path is provided. */
  clearError: (path?: FormFieldPath<TOutput>) => void
  /** Focuses a mounted field by raw path. */
  focus: (path: FormFieldPath<TOutput> | readonly string[]) => Promise<boolean>
  /** Submits the form through the configured submit lifecycle. */
  submit: () => Promise<void>
  /** Resets the form and waits for dependency effects triggered by the reset. */
  reset: () => Promise<void>
}

export type FormSubmitAction = 'next' | 'previous' | 'submit' | 'reset'

export type FormSubmitResult<TSubmitData = FormValue> =
  | boolean
  | void
  | { success: false }
  | { success: true; data?: TSubmitData }

export interface FormSubmitHandlerParams<TOutput = FormObject> {
  /** Submitted output value after output transforms and omitted fields are applied. */
  formData: TOutput
  /** Namespaced form API for state, validation, submit, and reset operations. */
  api: FormApi<TOutput>
}

export type FormSubmitHandler<TOutput = FormObject, TSubmitData = FormValue> = (
  params: FormSubmitHandlerParams<TOutput>,
) => FormMaybePromise<FormSubmitResult<TSubmitData>>

export interface FormSubmitHandlerResult<TSubmitData = FormValue> {
  success: boolean
  data?: TSubmitData
}

export interface FormSubmitTarget<TOutput = FormObject, TSubmitData = FormValue> {
  actionPending: ComputedRef<FormSubmitAction | null>
  submitHandler: (
    submitHandler?: FormSubmitHandler<TOutput, TSubmitData>,
  ) => Promise<FormSubmitHandlerResult<TSubmitData>>
}
