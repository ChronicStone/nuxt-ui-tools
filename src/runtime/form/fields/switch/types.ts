import type { FormStatefulFieldBase } from '../../types/field-base'
import type { FormOptionValue } from '../../types/options'

export interface FormSwitchField<
  TContext = {},
  TDeps = {},
  TTrue extends FormOptionValue = true,
  TFalse extends FormOptionValue = false,
> extends FormStatefulFieldBase<'switch', TTrue | TFalse, TContext, TDeps> {
  /** Value written when the switch is enabled. Defaults to `true`. */
  trueValue?: TTrue
  /** Value written when the switch is disabled. Defaults to `false`. */
  falseValue?: TFalse
  /** Icon displayed by Nuxt UI when the switch is enabled. */
  checkedIcon?: string
  /** Icon displayed by Nuxt UI when the switch is disabled. */
  uncheckedIcon?: string
  /** Displays the Nuxt UI loading state on the control. */
  loading?: boolean
}

export type SwitchFieldOutput<TField> =
  TField extends { trueValue: infer TTrue, falseValue: infer TFalse } ? TTrue | TFalse
  : TField extends { trueValue: infer TTrue } ? TTrue | false
  : TField extends { falseValue: infer TFalse } ? true | TFalse
  : boolean
