import type { FormContainerFieldBase } from '../../types/field-base'

export interface FormGroupField<TContext = {}, TDeps = {}> extends FormContainerFieldBase<
  'group',
  TContext,
  TDeps
> {}

export type GroupFieldOutput<TChildren> = TChildren
