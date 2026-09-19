import type { FormStatefulFieldBase } from '../../types/field-base'
import type { FieldOptionValue, FallbackNever, NullableValue } from '../../types/field-output-utils'
import type { FormAnyOptionConfig, FormOptionItem, FormOptionValue } from '../../types/options'

export type FormSelectCreateItem =
  | boolean
  | 'always'
  | {
      position?: 'top' | 'bottom'
      when?: 'always' | 'empty'
    }

export interface FormSelectField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
  TValue extends FormOptionValue = FormOptionValue,
  TOption extends FormOptionItem<TValue> = FormOptionItem<TValue>,
> extends FormStatefulFieldBase<'select', TValue | readonly TValue[] | null, TContext, TDeps> {
  options: FormAnyOptionConfig<TOption, TContext, TDeps, TValue | readonly TValue[] | null>
  multiple?: boolean
  searchable?: boolean
  clearable?: boolean
  createItem?: FormSelectCreateItem
  max?: number
}

type SelectFieldValue<TField> = TField extends { multiple: true }
  ? readonly FieldOptionValue<TField>[] | NullableValue
  : FieldOptionValue<TField> | NullableValue

type SelectFieldFallback<TField> = FallbackNever<
  SelectFieldValue<TField>,
  TField extends { multiple: true }
    ? readonly FormOptionValue[] | NullableValue
    : FormOptionValue | NullableValue
>

export type SelectFieldOutput<TField> = SelectFieldFallback<TField>
