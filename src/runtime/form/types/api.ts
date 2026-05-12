import type { ComputedRef } from 'vue'
import type { FormContextData } from './context'
import type { FormMaybePromise, FormObject } from './utils'

export type FormRefreshableContextKey<TContext> = {
  [TKey in keyof TContext]: Extract<TContext[TKey], { refresh: () => Promise<void> }> extends never ? never : TKey
}[keyof TContext] & string

export type FormContextResourceValue<TResource> = TResource extends { value: infer TValue } ? TValue : unknown

export type FormPatchableContextKey<TContext> = {
  [TKey in keyof TContext]: NonNullable<FormContextResourceValue<TContext[TKey]>> extends readonly unknown[]
    ? never
    : NonNullable<FormContextResourceValue<TContext[TKey]>> extends object
      ? TKey
      : never
}[keyof TContext] & string

export type FormContextPatchValue<TContext, TKey extends keyof TContext> = Partial<
  NonNullable<FormContextResourceValue<TContext[TKey]>>
>

/**
 * Public value namespace exposed to a mounted field.
 */
export interface FormFieldValueApi<TValue = unknown> {
  /** Reads the current internal field value. */
  get: () => TValue
  /** Updates the current internal field value. */
  set: (value: TValue) => void
  /** Resets the current internal field value to its configured default. */
  reset: () => void
}

/**
 * Public option namespace exposed to option-based fields.
 */
export interface FormFieldOptionsApi<TOption = unknown> {
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
  /** Returns the latest option-source error, if any. */
  error: () => unknown | null
  /** Refreshes the option source when it is async or query-backed. */
  refresh: () => Promise<void>
  /** Creates a new option when the field configured an option creation handler. */
  create: (label: string) => Promise<TOption | null>
}

/**
 * Public upload namespace exposed to upload fields.
 */
export interface FormFieldUploadApi<TValue = unknown> {
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
  /** Sets an external field error. */
  setError: (message: string) => void
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
    updater: (value: FormContextResourceValue<TContext[TKey]>) => FormContextResourceValue<TContext[TKey]>,
  ) => void
  /** Shallow-patches object context values. Arrays and primitives should use `set` or `update`. */
  patch: <TKey extends FormPatchableContextKey<TContext>>(
    key: TKey,
    value: FormContextPatchValue<TContext, TKey> | ((
      value: NonNullable<FormContextResourceValue<TContext[TKey]>>
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
export interface FormFieldApi<TValue = unknown, TOption = unknown, TContext = FormContextData> {
  /** Field-local value operations. */
  value: FormFieldValueApi<TValue>
  /** Form-scoped context operations. */
  context: FormFieldContextApi<TContext>
  /** Option operations. Present for all fields at type level only where the field supports options. */
  options: FormFieldOptionsApi<TOption>
  /** Upload operations. Present for upload fields. */
  upload: FormFieldUploadApi<TValue>
  /** Validation operations for the field. */
  validation: FormFieldValidationApi
}

/**
 * Public form API available from form-level callbacks.
 */
export interface FormApi {
  /** Reads an internal form value by raw path. */
  get: (path: string) => unknown
  /** Writes an internal form value by raw path. */
  set: (path: string, value: unknown) => void
  /** Runs form validation. */
  validate: () => Promise<boolean>
  /** Submits the form through the configured submit lifecycle. */
  submit: () => Promise<void>
  /** Resets the form to configured defaults. */
  reset: () => void
}

export type FormSubmitAction = 'next' | 'previous' | 'submit'

export type FormSubmitResult<TSubmitData = unknown> =
  | boolean
  | void
  | { success: false }
  | { success: true, data?: TSubmitData }

export interface FormSubmitHandlerParams<TOutput = FormObject> {
  /** Submitted output value after output transforms and omitted fields are applied. */
  formData: TOutput
  /** Namespaced form API for state, validation, submit, and reset operations. */
  api: FormApi
}

export type FormSubmitHandler<TOutput = FormObject, TSubmitData = unknown> = (
  params: FormSubmitHandlerParams<TOutput>
) => FormMaybePromise<FormSubmitResult<TSubmitData>>

export interface FormSubmitHandlerResult<TSubmitData = unknown> {
  success: boolean
  data?: TSubmitData
}

export interface FormSubmitTarget<TOutput = FormObject, TSubmitData = unknown> {
  actionPending: ComputedRef<FormSubmitAction | null>
  submitHandler: (
    submitHandler?: FormSubmitHandler<TOutput, TSubmitData>,
  ) => Promise<FormSubmitHandlerResult<TSubmitData>>
}
