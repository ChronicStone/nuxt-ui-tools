import type { FormStatefulFieldBase } from '../../types/field-base'
import type { FieldOptionValue, NullableValue } from '../../types/field-output-utils'
import type { FormOptionItem, FormOptionValue, FormOptionsSource } from '../../types/options'

export interface FormRadioCardProps {
  orientation?: 'horizontal' | 'vertical'
}

export interface FormRadioCardField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
  TValue extends FormOptionValue = FormOptionValue,
  TOption extends FormOptionItem<TValue> = FormOptionItem<TValue>,
> extends FormStatefulFieldBase<'radio-card', TValue | null, TContext, TDeps, FormRadioCardProps> {
  options: FormOptionsSource<TOption, TContext, TDeps, TValue | null>
}

export type RadioCardFieldOutput<TField> = FieldOptionValue<TField> | NullableValue
