import type { FormContainerFieldBase } from '../../types/field-base'

export interface FormInputGroupProps {
  orientation?: 'horizontal' | 'vertical'
}

export type FormInputGroupField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> = FormContainerFieldBase<'input-group', TContext, TDeps, FormInputGroupProps>
