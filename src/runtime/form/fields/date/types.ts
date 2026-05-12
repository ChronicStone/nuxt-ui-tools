import type { FormStatefulFieldBase } from '../../types/field-base'
import type { NullableValue } from '../../types/field-output-utils'

export interface FormDateField<TContext = {}, TDeps = {}>
  extends FormStatefulFieldBase<'date', Date | string | null, TContext, TDeps> {
  min?: Date | string
  max?: Date | string
}

export type DateFieldOutput = Date | string | NullableValue
