import type { FormStatefulFieldBase } from '../../types/field-base'

export interface FormCheckboxField<TContext = {}, TDeps = {}>
  extends FormStatefulFieldBase<'checkbox', boolean, TContext, TDeps> {}

export type CheckboxFieldOutput = boolean
