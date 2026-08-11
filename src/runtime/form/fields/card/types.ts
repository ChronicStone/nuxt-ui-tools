import type { FormFieldCallback } from '../../types/callbacks'
import type { FormContainerFieldBase } from '../../types/field-base'
import type { FormRenderable } from '../../types/utils'

export interface FormCardField<TContext = {}, TDeps = {}> extends FormContainerFieldBase<
  'card',
  TContext,
  TDeps
> {
  header?: FormRenderable | FormFieldCallback<FormRenderable, TContext, TDeps>
  headerExtra?: FormRenderable | FormFieldCallback<FormRenderable, TContext, TDeps>
  footer?: FormRenderable | FormFieldCallback<FormRenderable, TContext, TDeps>
  action?: FormRenderable | FormFieldCallback<FormRenderable, TContext, TDeps>
}
