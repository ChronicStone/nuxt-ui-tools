import type { FormStatefulFieldBase } from '../../types/field-base'
import type { FieldOptionValue, NullableValue } from '../../types/field-output-utils'
import type {
  FormOptionConfig,
  FormOptionItem,
  FormOptionValue,
  FormOptionsSource,
} from '../../types/options'

export interface FormCheckboxGroupField<
  TContext = {},
  TDeps = {},
  TValue extends FormOptionValue = FormOptionValue,
  TOption extends FormOptionItem<TValue> = FormOptionItem<TValue>,
> extends FormStatefulFieldBase<'checkbox-group', readonly TValue[] | null, TContext, TDeps> {
  options:
    | FormOptionConfig<TOption, TContext, TDeps, readonly TValue[] | null>
    | FormOptionsSource<TOption, TContext, TDeps, readonly TValue[] | null>
  variant?: 'table' | 'list' | 'card'
  orientation?: 'horizontal' | 'vertical'
  indicator?: 'start' | 'end' | 'hidden'
}

export type CheckboxGroupFieldOutput<TField> = readonly FieldOptionValue<TField>[] | NullableValue
