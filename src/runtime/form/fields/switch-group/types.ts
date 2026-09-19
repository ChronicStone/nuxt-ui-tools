import type { FormStatefulFieldBase } from '../../types/field-base'
import type { FieldOptionValue, NullableValue } from '../../types/field-output-utils'
import type {
  FormOptionConfig,
  FormOptionItem,
  FormOptionValue,
  FormOptionsSource,
} from '../../types/options'

export interface FormSwitchGroupProps {
  orientation?: 'horizontal' | 'vertical'
  checkedIcon?: string
  uncheckedIcon?: string
}

export interface FormSwitchGroupField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
  TValue extends FormOptionValue = FormOptionValue,
  TOption extends FormOptionItem<TValue> = FormOptionItem<TValue>,
> extends FormStatefulFieldBase<
  'switch-group',
  readonly TValue[] | null,
  TContext,
  TDeps,
  FormSwitchGroupProps
> {
  options:
    | FormOptionConfig<TOption, TContext, TDeps, readonly TValue[] | null>
    | FormOptionsSource<TOption, TContext, TDeps, readonly TValue[] | null>
}

export type SwitchGroupFieldOutput<TField> = readonly FieldOptionValue<TField>[] | NullableValue
