import type { FormContainerFieldBase } from '../../types/field-base'

export interface FormArrayVariantField<TContext = {}, TDeps = {}>
  extends FormContainerFieldBase<'array-variant', TContext, TDeps> {}

export type ArrayVariantFieldOutput<TChildren> = readonly TChildren[]
