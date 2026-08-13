import type { FormContainerFieldBase } from '../../types/field-base'

export interface FormInputGroupField<TContext = {}, TDeps = {}> extends FormContainerFieldBase<
  'input-group',
  TContext,
  TDeps
> {}
