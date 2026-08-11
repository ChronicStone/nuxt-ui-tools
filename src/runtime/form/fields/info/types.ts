import type { FormFieldCallback } from '../../types/callbacks'
import type { FormStatelessFieldBase } from '../../types/field-base'
import type { FormRenderable } from '../../types/utils'

export interface FormInfoField<TContext = {}, TDeps = {}> extends FormStatelessFieldBase<
  'info',
  TContext,
  TDeps
> {
  content: FormRenderable | FormFieldCallback<FormRenderable, TContext, TDeps>
}
