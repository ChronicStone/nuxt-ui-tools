import type { FormContainerFieldBase } from '../../types/field-base'

export interface FormColumnField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> extends FormContainerFieldBase<'column', TContext, TDeps> {}
