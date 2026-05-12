import type { FormFieldApi } from './api'
/**
 * Parameters passed to field-level callbacks.
 */
export interface FormFieldCallbackParams<
  TContext = {},
  TDeps = {},
  TValue = unknown,
  TOption = unknown,
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
export type FormFieldCallback<TResult, TContext = {}, TDeps = {}, TValue = unknown, TOption = unknown> = (
  params: FormFieldCallbackParams<TContext, TDeps, TValue, TOption>,
) => TResult
