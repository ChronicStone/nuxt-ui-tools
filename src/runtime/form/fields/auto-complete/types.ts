import type { FormStatefulFieldBase } from '../../types/field-base'
import type { FieldOptionValue, FallbackNever, NullableValue } from '../../types/field-output-utils'
import type {
  FormOptionConfig,
  FormOptionItem,
  FormOptionValue,
  FormOptionsSource,
} from '../../types/options'
import type { FormSelectCreateItem } from '../select/types'

export interface FormAutoCompleteField<
  TContext = {},
  TDeps = {},
  TValue extends FormOptionValue = FormOptionValue,
  TOption extends FormOptionItem<TValue> = FormOptionItem<TValue>,
> extends FormStatefulFieldBase<
  'auto-complete',
  TValue | readonly TValue[] | null,
  TContext,
  TDeps
> {
  options:
    | FormOptionConfig<TOption, TContext, TDeps, TValue | readonly TValue[] | null>
    | FormOptionsSource<TOption, TContext, TDeps, TValue | readonly TValue[] | null>
  multiple?: boolean
  clearable?: boolean
  createItem?: FormSelectCreateItem
}

type AutoCompleteFieldValue<TField> = TField extends { multiple: true }
  ? readonly FieldOptionValue<TField>[] | NullableValue
  : FieldOptionValue<TField> | NullableValue

export type AutoCompleteFieldOutput<TField> = FallbackNever<
  AutoCompleteFieldValue<TField>,
  TField extends { multiple: true }
    ? readonly FormOptionValue[] | NullableValue
    : FormOptionValue | NullableValue
>
