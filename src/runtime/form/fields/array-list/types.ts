import type { FormContainerFieldBase } from '../../types/field-base'

export interface FormArrayListField<TContext = {}, TDeps = {}>
  extends FormContainerFieldBase<'array-list', TContext, TDeps> {}

export type ArrayListFieldOutput<TChildren> = readonly TChildren[]
