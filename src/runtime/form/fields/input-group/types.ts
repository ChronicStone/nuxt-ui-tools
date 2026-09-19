import type { FormContainerFieldBase } from '../../types/field-base'

export interface FormInputGroupField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> extends FormContainerFieldBase<'input-group', TContext, TDeps> {
  orientation?: 'horizontal' | 'vertical'
}
