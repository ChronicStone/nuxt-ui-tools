import type { FormValue } from './'
import type { FormFieldApi } from './api'

/**
 * The dependencies a field callback reads, each under the target name its `dependencies` entry
 * declares.
 *
 * @example
 * ```ts
 * dependencies: ['year', ['profile.country', 'country']],
 * options: ({ deps }) => ratesFor(deps.get<number | null>('year'), deps.get<string>('country')),
 * ```
 */
export interface FormDependencies {
  /**
   * Reads the dependency declared under `key`, typed as the caller states. The engine does not
   * check the type, since a reusable field can be mounted anywhere; a key the field did not declare
   * reads as `undefined`.
   */
  get: <TValue = FormValue>(key: string) => TValue
}

/**
 * Parameters passed to field-level callbacks.
 */
export interface FormFieldCallbackParams<
  TContext = NonNullable<unknown>,
  TDeps = FormDependencies,
  TValue = FormValue,
  TOption = FormValue,
> {
  /** Fully typed form-scoped context declared on the schema. */
  ctx: TContext
  /** The field's declared dependencies, read with `deps.get(key)`. */
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
  TDeps = FormDependencies,
  TValue = FormValue,
  TOption = FormValue,
> = (params: FormFieldCallbackParams<TContext, TDeps, TValue, TOption>) => TResult
