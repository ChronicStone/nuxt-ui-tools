import type { FormStatefulFieldBase } from '../../types/field-base'
import type { NullableValue } from '../../types/field-output-utils'

export interface FormTimeField<TContext = {}, TDeps = {}> extends FormStatefulFieldBase<
  'time',
  string | null,
  TContext,
  TDeps
> {
  min?: string
  max?: string
  step?: number
  minuteStep?: number
  clearable?: boolean
}

export type TimeFieldOutput = string | NullableValue
