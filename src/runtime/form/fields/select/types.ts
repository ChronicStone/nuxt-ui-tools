import type { FormStatefulFieldBase } from '../../types/field-base'
import type { FieldOptionValue, FallbackNever, NullableValue } from '../../types/field-output-utils'
import type {
  FormOptionConfig,
  FormOptionItem,
  FormOptionValue,
  FormOptionsSource,
} from '../../types/options'

export type FormSelectCreateItem =
  | boolean
  | 'always'
  | {
      position?: 'top' | 'bottom'
      when?: 'always' | 'empty'
    }

export interface FormSelectField<
  TContext = {},
  TDeps = {},
  TValue extends FormOptionValue = FormOptionValue,
  TOption extends FormOptionItem<TValue> = FormOptionItem<TValue>,
> extends FormStatefulFieldBase<'select', TValue | readonly TValue[] | null, TContext, TDeps> {
  options:
    | FormOptionConfig<TOption, TContext, TDeps, TValue | readonly TValue[] | null>
    | FormOptionsSource<TOption, TContext, TDeps, TValue | readonly TValue[] | null>
  multiple?: boolean
  searchable?: boolean
  clearable?: boolean
  createItem?: FormSelectCreateItem
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
