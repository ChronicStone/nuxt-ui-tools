import type { FormStatefulFieldBase } from '../../types/field-base'
import type { NullableValue } from '../../types/field-output-utils'
import type { FormText } from '../../types/utils'

export interface FormPasswordVisibilityToggle {
  showIcon?: string
  hideIcon?: string
  showLabel?: FormText
  hideLabel?: FormText
}

export interface FormPasswordProps {
  visibilityToggle?: boolean | FormPasswordVisibilityToggle
}

export type FormPasswordField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> = FormStatefulFieldBase<'password', string | null, TContext, TDeps, FormPasswordProps>

export type PasswordFieldOutput = string | NullableValue
