import type { FormStatefulFieldBase } from '../../types/field-base'
import type { FieldOptionValue, NullableValue } from '../../types/field-output-utils'
import type { FormOptionItem, FormOptionValue, FormOptionsSource } from '../../types/options'
import type { FormChoiceCardProps } from '../choice-card/types'

export interface FormRadioCardField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
  TValue extends FormOptionValue = FormOptionValue,
  TOption extends FormOptionItem<TValue> = FormOptionItem<TValue>,
> extends FormStatefulFieldBase<'radio-card', TValue | null, TContext, TDeps, FormChoiceCardProps> {
  options: FormOptionsSource<TOption, TContext, TDeps, TValue | null>
}

export type RadioCardFieldOutput<TField> = FieldOptionValue<TField> | NullableValue
