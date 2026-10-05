import type { FormStatefulFieldBase } from '../../types/field-base'
import type { FieldOptionValue, NullableValue } from '../../types/field-output-utils'
import type { FormOptionItem, FormOptionValue, FormOptionsSource } from '../../types/options'

export interface FormRadioProps {
  /**
   * `list` (the default) lines up bare radios, `card` frames each option on its own, and `table`
   * joins the options into one framed list with a divider between rows and the selected row
   * tinted, a good fit for a choice of roles with a description each.
   */
  variant?: 'list' | 'card' | 'table'
  orientation?: 'horizontal' | 'vertical'
  indicator?: 'start' | 'end' | 'hidden'
}

export interface FormRadioField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
  TValue extends FormOptionValue = FormOptionValue,
  TOption extends FormOptionItem<TValue> = FormOptionItem<TValue>,
> extends FormStatefulFieldBase<'radio', TValue | null, TContext, TDeps, FormRadioProps> {
  options: FormOptionsSource<TOption, TContext, TDeps, TValue | null>
}

export type RadioFieldOutput<TField> = FieldOptionValue<TField> | NullableValue
