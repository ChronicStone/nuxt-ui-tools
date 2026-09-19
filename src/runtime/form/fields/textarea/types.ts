import type { FormStatefulFieldBase } from '../../types/field-base'
import type { NullableValue } from '../../types/field-output-utils'

export interface FormTextareaProps {
  autoresize?: boolean
  rows?: number
  maxrows?: number
  maxlength?: number
}

export type FormTextareaField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> = FormStatefulFieldBase<'textarea', string | null, TContext, TDeps, FormTextareaProps>

export type TextareaFieldOutput = string | NullableValue
