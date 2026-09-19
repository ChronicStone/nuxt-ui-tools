import type { FormStatefulFieldBase } from '../../types/field-base'
import type {
  FieldOptionValue,
  FieldProps,
  FallbackNever,
  NullableValue,
} from '../../types/field-output-utils'
import type { FormAnyOptionConfig, FormOptionItem, FormOptionValue } from '../../types/options'
import type { FormSelectCreateItem } from '../select/types'

export interface FormAutoCompleteProps {
  multiple?: boolean
  clearable?: boolean
  createItem?: FormSelectCreateItem
}

export interface FormAutoCompleteField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
  TValue extends FormOptionValue = FormOptionValue,
  TOption extends FormOptionItem<TValue> = FormOptionItem<TValue>,
> extends FormStatefulFieldBase<
  'auto-complete',
  TValue | readonly TValue[] | null,
  TContext,
  TDeps,
  FormAutoCompleteProps
> {
  options: FormAnyOptionConfig<TOption, TContext, TDeps, TValue | readonly TValue[] | null>
}

type AutoCompleteFieldValue<TField> =
  FieldProps<TField> extends { multiple: true }
    ? readonly FieldOptionValue<TField>[] | NullableValue
    : FieldOptionValue<TField> | NullableValue

export type AutoCompleteFieldOutput<TField> = FallbackNever<
  AutoCompleteFieldValue<TField>,
  FieldProps<TField> extends { multiple: true }
    ? readonly FormOptionValue[] | NullableValue
    : FormOptionValue | NullableValue
>
