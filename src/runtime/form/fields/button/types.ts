import type { FormFieldCallback } from '../../types/callbacks'
import type { FormStatelessFieldBase } from '../../types/field-base'
import type { FormText } from '../../types/utils'

export interface FormButtonField<TContext = {}, TDeps = {}> extends FormStatelessFieldBase<
  'button',
  TContext,
  TDeps
> {
  label?: FormText
  icon?: string
  color?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'
  variant?: 'solid' | 'outline' | 'soft' | 'subtle' | 'ghost' | 'link'
  disabled?: FormFieldCallback<boolean, TContext, TDeps>
  onClick: FormFieldCallback<void | Promise<void>, TContext, TDeps>
}
