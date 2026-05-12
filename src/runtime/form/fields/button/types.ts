import type { FormFieldCallback } from '../../types/callbacks'
import type { FormStatelessFieldBase } from '../../types/field-base'
import type { FormText } from '../../types/utils'

export interface FormButtonField<TContext = {}, TDeps = {}>
  extends FormStatelessFieldBase<'button', TContext, TDeps> {
  label?: FormText
  icon?: string
  onClick: FormFieldCallback<void | Promise<void>, TContext, TDeps>
}
