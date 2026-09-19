import type { FormContainerFieldBase } from '../../types/field-base'

export interface FormGroupField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> extends FormContainerFieldBase<'group', TContext, TDeps> {}

export type GroupFieldOutput<TChildren> = TChildren
