import type { FormStatefulFieldBase } from '../../types/field-base'
import type { NullableValue } from '../../types/field-output-utils'

export interface FormTextField<TContext = {}, TDeps = {}> extends FormStatefulFieldBase<
  'text',
  string | null,
  TContext,
  TDeps
> {
  inputType?: 'text' | 'email' | 'url' | 'tel' | 'search'
}

export type TextFieldOutput = string | NullableValue
