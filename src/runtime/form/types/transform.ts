import type { FormValue } from './'
import type { FormFieldCallbackParams } from './callbacks'

/**
 * Input/output transform hooks for a stateful field.
 *
 * The hooks are methods so a field can declare the value it accepts: `input(value: string)`
 * types the field in `ExtractFormInput`, and `output` types it in `ExtractFormOutput`.
 */
export interface FormTransformConfig<
  TInternal = FormValue,
  TExternal = TInternal,
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> {
  /** Converts an incoming raw value into the internal form value. Replaces legacy `preformat`. */
  input?(value: TExternal, params: FormFieldCallbackParams<TContext, TDeps, TInternal>): TInternal
  /** Converts the internal form value into the submitted output value. Replaces legacy `transform`. */
  output?(value: TInternal, params: FormFieldCallbackParams<TContext, TDeps, TInternal>): TExternal
}
