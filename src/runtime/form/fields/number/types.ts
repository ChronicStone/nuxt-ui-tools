import type { FormStatefulFieldBase } from '../../types/field-base'
import type { NullableValue } from '../../types/field-output-utils'
import type { FormText } from '../../types/utils'

export interface FormNumberProps {
  min?: number
  max?: number
  step?: number
  prefix?: FormText
  suffix?: FormText
  format?: Intl.NumberFormatOptions
  controls?: boolean
  mono?: boolean
}

export type FormNumberField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> = FormStatefulFieldBase<'number', number | null, TContext, TDeps, FormNumberProps>

export type NumberFieldOutput = number | NullableValue
