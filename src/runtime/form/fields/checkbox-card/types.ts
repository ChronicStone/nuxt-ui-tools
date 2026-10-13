import type { FormStatefulFieldBase } from '../../types/field-base'
import type { FieldOptionValue, NullableValue } from '../../types/field-output-utils'
import type {
  FormOptionConfig,
  FormOptionGrouping,
  FormOptionValue,
  FormOptionsSource,
} from '../../types/options'
import type { FormChoiceCardOptionItem, FormChoiceCardProps } from '../choice-card/types'

export interface FormCheckboxCardField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
  TValue extends FormOptionValue = FormOptionValue,
  TOption extends FormChoiceCardOptionItem<TValue> = FormChoiceCardOptionItem<TValue>,
>
  extends
    FormStatefulFieldBase<
      'checkbox-card',
      readonly TValue[] | null,
      TContext,
      TDeps,
      FormChoiceCardProps
    >,
    FormOptionGrouping {
  options:
    | FormOptionConfig<TOption, TContext, TDeps, readonly TValue[] | null>
    | FormOptionsSource<TOption, TContext, TDeps, readonly TValue[] | null>
}

export type CheckboxCardFieldOutput<TField> = readonly FieldOptionValue<TField>[] | NullableValue
