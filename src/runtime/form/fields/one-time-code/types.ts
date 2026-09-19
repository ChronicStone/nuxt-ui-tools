import type { FormStatefulFieldBase } from '../../types/field-base'
import type { NullableValue } from '../../types/field-output-utils'

export interface FormOneTimeCodeProps {
  length?: number
  mask?: boolean
  otp?: boolean
  inputType?: 'text' | 'number'
}

export type FormOneTimeCodeField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> = FormStatefulFieldBase<'one-time-code', string | null, TContext, TDeps, FormOneTimeCodeProps>

export type OneTimeCodeFieldOutput = string | NullableValue
