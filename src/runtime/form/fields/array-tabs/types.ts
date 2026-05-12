import type { FormContainerFieldBase } from '../../types/field-base'

export interface FormArrayTabsField<TContext = {}, TDeps = {}>
  extends FormContainerFieldBase<'array-tabs', TContext, TDeps> {}

export type ArrayTabsFieldOutput<TChildren> = readonly TChildren[]
