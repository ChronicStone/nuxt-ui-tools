import type { FormStatefulFieldBase } from '../../types/field-base'
import type { NullableValue } from '../../types/field-output-utils'

export interface FormRatingField<TContext = {}, TDeps = {}> extends FormStatefulFieldBase<
  'rating',
  number | null,
  TContext,
  TDeps
> {
  max?: number
  clearable?: boolean
  icon?: string
}

export type RatingFieldOutput = number | NullableValue
