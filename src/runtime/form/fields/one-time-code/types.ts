import type { FormStatefulFieldBase } from '../../types/field-base'
import type { NullableValue } from '../../types/field-output-utils'

export interface FormOneTimeCodeField<TContext = {}, TDeps = {}> extends FormStatefulFieldBase<
  'one-time-code',
  string | null,
  TContext,
  TDeps
> {
  length?: number
  mask?: boolean
  otp?: boolean
  inputType?: 'text' | 'number'
}

export type OneTimeCodeFieldOutput = string | NullableValue
