import type { FormStatefulFieldBase } from '../../types/field-base'
import type { FieldProps } from '../../types/field-output-utils'
import type { FormOptionValue } from '../../types/options'

export interface FormSwitchProps<
  TTrue extends FormOptionValue = true,
  TFalse extends FormOptionValue = false,
> {
  trueValue?: TTrue
  falseValue?: TFalse
  checkedIcon?: string
  uncheckedIcon?: string
  /**
   * Icon drawn before the label and the description, centered on both, for a switch laid out as a
   * row that names what it turns on. Style it with the `ui.leadingIcon` slot.
   *
   * @example
   * ```ts
   * props: { icon: 'i-lucide-gauge', ui: { leadingIcon: 'text-info' } }
   * ```
   */
  icon?: string
  loading?: boolean
}

export type FormSwitchField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
  TTrue extends FormOptionValue = true,
  TFalse extends FormOptionValue = false,
> = FormStatefulFieldBase<'switch', TTrue | TFalse, TContext, TDeps, FormSwitchProps<TTrue, TFalse>>

export type SwitchFieldOutput<TField> =
  FieldProps<TField> extends {
    trueValue: infer TTrue
    falseValue: infer TFalse
  }
    ? TTrue | TFalse
    : FieldProps<TField> extends { trueValue: infer TTrue }
      ? TTrue | false
      : FieldProps<TField> extends { falseValue: infer TFalse }
        ? true | TFalse
        : boolean
