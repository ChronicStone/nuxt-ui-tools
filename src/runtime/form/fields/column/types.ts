import type { FormContainerFieldBase } from '../../types/field-base'

export interface FormColumnField<TContext = {}, TDeps = {}> extends FormContainerFieldBase<
  'column',
  TContext,
  TDeps
> {}
