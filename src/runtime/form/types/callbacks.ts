import type { FormValue } from './'
import type { FormFieldApi } from './api'
import type { FormObject } from './utils'

/**
 * Dependency values a field callback reads: each declared dependency under its target name, typed
 * `FormValue` until the callback narrows it, since a reusable field can be mounted anywhere.
 */
export type FormDependencyValues = Readonly<FormObject>
/**
 * Parameters passed to field-level callbacks.
 */
export interface FormFieldCallbackParams<
  TContext = NonNullable<unknown>,
  TDeps = FormDependencyValues,
  TValue = FormValue,
  TOption = FormValue,
> {
  /** Fully typed form-scoped context declared on the schema. */
  ctx: TContext
  /** Values read from the field's dependency list. */
  deps: TDeps
  /** Field-level API for values, options, upload work, and validation. */
  api: FormFieldApi<TValue, TOption, TContext>
}

/**
 * Function receiving field callback parameters.
 */
export type FormFieldCallback<
  TResult,
  TContext = NonNullable<unknown>,
  TDeps = FormDependencyValues,
  TValue = FormValue,
  TOption = FormValue,
> = (params: FormFieldCallbackParams<TContext, TDeps, TValue, TOption>) => TResult
