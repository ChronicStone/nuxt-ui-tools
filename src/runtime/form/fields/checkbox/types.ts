import type { FormStatefulFieldBase } from '../../types/field-base'

export interface FormCheckboxField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> extends FormStatefulFieldBase<'checkbox', boolean, TContext, TDeps> {}

export type CheckboxFieldOutput = boolean
