import type { FormStatefulFieldBase } from '../../types/field-base'
import type {
  FieldOptionValue,
  FieldProps,
  FallbackNever,
  NullableValue,
} from '../../types/field-output-utils'
import type { FormAnyOptionConfig, FormOptionItem, FormOptionValue } from '../../types/options'

export type FormSelectCreateItem =
  | boolean
  | 'always'
  | {
      position?: 'top' | 'bottom'
      when?: 'always' | 'empty'
    }

export interface FormSelectProps {
  multiple?: boolean
  searchable?: boolean
  clearable?: boolean
  createItem?: FormSelectCreateItem
  max?: number
}

export interface FormSelectField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
  TValue extends FormOptionValue = FormOptionValue,
  TOption extends FormOptionItem<TValue> = FormOptionItem<TValue>,
> extends FormStatefulFieldBase<
  'select',
  TValue | readonly TValue[] | null,
  TContext,
  TDeps,
  FormSelectProps
> {
  options: FormAnyOptionConfig<TOption, TContext, TDeps, TValue | readonly TValue[] | null>
}

type SelectFieldValue<TField> =
  FieldProps<TField> extends { multiple: true }
    ? readonly FieldOptionValue<TField>[] | NullableValue
    : FieldOptionValue<TField> | NullableValue

type SelectFieldFallback<TField> = FallbackNever<
  SelectFieldValue<TField>,
  FieldProps<TField> extends { multiple: true }
    ? readonly FormOptionValue[] | NullableValue
    : FormOptionValue | NullableValue
>

export type SelectFieldOutput<TField> = SelectFieldFallback<TField>
