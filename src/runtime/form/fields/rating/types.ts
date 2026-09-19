import type { FormStatefulFieldBase } from '../../types/field-base'
import type { NullableValue } from '../../types/field-output-utils'

export interface FormRatingProps {
  max?: number
  clearable?: boolean
  icon?: string
}

export type FormRatingField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> = FormStatefulFieldBase<'rating', number | null, TContext, TDeps, FormRatingProps>

export type RatingFieldOutput = number | NullableValue
