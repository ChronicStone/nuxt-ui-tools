import type { FormFieldCallback } from '../../types/callbacks'
import type { FormStatelessFieldBase } from '../../types/field-base'
import type { FormText } from '../../types/utils'

export interface FormButtonProps {
  icon?: string
  color?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'
  variant?: 'solid' | 'outline' | 'soft' | 'subtle' | 'ghost' | 'link'
}

export interface FormButtonField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> extends FormStatelessFieldBase<'button', TContext, TDeps, FormButtonProps> {
  label?: FormText
  disabled?: FormFieldCallback<boolean, TContext, TDeps>
  onClick: FormFieldCallback<void | Promise<void>, TContext, TDeps>
}
