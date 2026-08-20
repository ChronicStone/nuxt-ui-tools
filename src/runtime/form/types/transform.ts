import type { FormValue } from './'
import type { FormFieldCallbackParams } from './callbacks'

/**
 * Input/output transform hooks for a stateful field.
 */
export interface FormTransformConfig<
  TInternal = FormValue,
  TExternal = TInternal,
  TContext = {},
  TDeps = {},
> {
  /** Converts an incoming raw value into the internal form value. Replaces legacy `preformat`. */
  input?: (
    value: TExternal,
    params: FormFieldCallbackParams<TContext, TDeps, TInternal>,
  ) => TInternal
  /** Converts the internal form value into the submitted output value. Replaces legacy `transform`. */
  output?: (
    value: TInternal,
    params: FormFieldCallbackParams<TContext, TDeps, TInternal>,
  ) => TExternal
}
