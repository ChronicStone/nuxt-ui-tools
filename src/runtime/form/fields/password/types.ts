import type { FormStatefulFieldBase } from '../../types/field-base'
import type { NullableValue } from '../../types/field-output-utils'
import type { FormText } from '../../types/utils'

export interface FormPasswordField<TContext = {}, TDeps = {}> extends FormStatefulFieldBase<
  'password',
  string | null,
  TContext,
  TDeps
> {
  /** Enables the trailing show/hide affordance. Defaults to `true`. */
  visibilityToggle?:
    | boolean
    | {
        showIcon?: string
        hideIcon?: string
        showLabel?: FormText
        hideLabel?: FormText
      }
}

export type PasswordFieldOutput = string | NullableValue
