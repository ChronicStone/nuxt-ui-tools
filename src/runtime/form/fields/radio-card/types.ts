import type { FormStatefulFieldBase } from '../../types/field-base'
import type { FieldOptionValue, NullableValue } from '../../types/field-output-utils'
import type { FormOptionItem, FormOptionValue, FormOptionsSource } from '../../types/options'

export interface FormRadioCardField<
  TContext = {},
  TDeps = {},
  TValue extends FormOptionValue = FormOptionValue,
  TOption extends FormOptionItem<TValue> = FormOptionItem<TValue>,
> extends FormStatefulFieldBase<'radio-card', TValue | null, TContext, TDeps> {
  options: FormOptionsSource<TOption, TContext, TDeps, TValue | null>
  orientation?: 'horizontal' | 'vertical'
}

export type RadioCardFieldOutput<TField> = FieldOptionValue<TField> | NullableValue
