import type { FormStatefulFieldBase } from '../../types/field-base'
import type { FieldOptionValue, NullableValue } from '../../types/field-output-utils'
import type {
  FormOptionConfig,
  FormOptionItem,
  FormOptionValue,
  FormOptionsSource,
} from '../../types/options'

export interface FormCheckboxCardProps {
  orientation?: 'horizontal' | 'vertical'
  indicator?: 'start' | 'end' | 'hidden'
}

export interface FormCheckboxCardField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
  TValue extends FormOptionValue = FormOptionValue,
  TOption extends FormOptionItem<TValue> = FormOptionItem<TValue>,
> extends FormStatefulFieldBase<
  'checkbox-card',
  readonly TValue[] | null,
  TContext,
  TDeps,
  FormCheckboxCardProps
> {
  options:
    | FormOptionConfig<TOption, TContext, TDeps, readonly TValue[] | null>
    | FormOptionsSource<TOption, TContext, TDeps, readonly TValue[] | null>
}

export type CheckboxCardFieldOutput<TField> = readonly FieldOptionValue<TField>[] | NullableValue
