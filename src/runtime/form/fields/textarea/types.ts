import type { FormStatefulFieldBase } from '../../types/field-base'
import type { NullableValue } from '../../types/field-output-utils'

export interface FormTextareaField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> extends FormStatefulFieldBase<'textarea', string | null, TContext, TDeps> {
  autoresize?: boolean
  rows?: number
  maxrows?: number
  maxlength?: number
}

export type TextareaFieldOutput = string | NullableValue
