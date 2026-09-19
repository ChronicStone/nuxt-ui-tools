import type { FormStatefulFieldBase } from '../../types/field-base'
import type { NullableValue } from '../../types/field-output-utils'
import type { FormText } from '../../types/utils'
import type { FormTextMask } from '../../utils/mask'

export interface FormTextProps {
  inputType?: 'text' | 'email' | 'url' | 'tel' | 'search'
  prefix?: FormText
  suffix?: FormText
  icon?: string
  trailingIcon?: string
  mono?: boolean
  clearable?: boolean
  maxlength?: number
  mask?: FormTextMask
  maskOutput?: 'masked' | 'raw'
}

export type FormTextField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> = FormStatefulFieldBase<'text', string | null, TContext, TDeps, FormTextProps>

export type TextFieldOutput = string | NullableValue
