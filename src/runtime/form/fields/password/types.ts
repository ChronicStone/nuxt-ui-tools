import type { FormStatefulFieldBase } from '../../types/field-base'
import type { NullableValue } from '../../types/field-output-utils'

export interface FormPasswordField<TContext = {}, TDeps = {}>
  extends FormStatefulFieldBase<'password', string | null, TContext, TDeps> {}

export type PasswordFieldOutput = string | NullableValue
