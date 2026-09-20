import type { FormStatefulFieldBase } from '../../types/field-base'
import type { NullableValue } from '../../types/field-output-utils'

export interface FormTimeProps {
  min?: string
  max?: string
  step?: number
  minuteStep?: number
  clearable?: boolean
}

export type FormTimeField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> = FormStatefulFieldBase<'time', string | null, TContext, TDeps, FormTimeProps>

export type TimeFieldOutput = string | NullableValue
