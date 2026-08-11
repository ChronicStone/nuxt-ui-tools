import type { FormStatefulFieldBase } from '../../types/field-base'
import type { NullableValue } from '../../types/field-output-utils'

export interface FormNumberField<TContext = {}, TDeps = {}> extends FormStatefulFieldBase<
  'number',
  number | null,
  TContext,
  TDeps
> {
  min?: number
  max?: number
  step?: number
}

export type NumberFieldOutput = number | NullableValue
