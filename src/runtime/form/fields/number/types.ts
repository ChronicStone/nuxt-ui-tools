import type { FormStatefulFieldBase } from '../../types/field-base'
import type { FormText } from '../../types/utils'
import type { NullableValue } from '../../types/field-output-utils'

export interface FormNumberField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> extends FormStatefulFieldBase<'number', number | null, TContext, TDeps> {
  min?: number
  max?: number
  step?: number
  prefix?: FormText
  suffix?: FormText
  format?: Intl.NumberFormatOptions
  controls?: boolean
  mono?: boolean
}

export type NumberFieldOutput = number | NullableValue
