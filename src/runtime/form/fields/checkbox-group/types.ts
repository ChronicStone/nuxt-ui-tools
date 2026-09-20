import type { FormStatefulFieldBase } from '../../types/field-base'
import type { FieldOptionValue, NullableValue } from '../../types/field-output-utils'
import type {
  FormOptionConfig,
  FormOptionItem,
  FormOptionValue,
  FormOptionsSource,
} from '../../types/options'

export interface FormCheckboxGroupProps {
  variant?: 'table' | 'list' | 'card'
  orientation?: 'horizontal' | 'vertical'
  indicator?: 'start' | 'end' | 'hidden'
}

export interface FormCheckboxGroupField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
  TValue extends FormOptionValue = FormOptionValue,
  TOption extends FormOptionItem<TValue> = FormOptionItem<TValue>,
> extends FormStatefulFieldBase<
  'checkbox-group',
  readonly TValue[] | null,
  TContext,
  TDeps,
  FormCheckboxGroupProps
> {
  options:
    | FormOptionConfig<TOption, TContext, TDeps, readonly TValue[] | null>
    | FormOptionsSource<TOption, TContext, TDeps, readonly TValue[] | null>
}

export type CheckboxGroupFieldOutput<TField> = readonly FieldOptionValue<TField>[] | NullableValue
