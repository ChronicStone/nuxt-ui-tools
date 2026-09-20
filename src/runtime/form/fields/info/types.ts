import type { FormFieldCallback } from '../../types/callbacks'
import type { FormStatelessFieldBase } from '../../types/field-base'
import type { FormRenderable, FormText } from '../../types/utils'

export interface FormInfoProps {
  title?: FormText
  icon?: string | false
  color?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'
  variant?: 'solid' | 'outline' | 'soft' | 'subtle'
}

export interface FormInfoField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> extends FormStatelessFieldBase<'info', TContext, TDeps, FormInfoProps> {
  content: FormRenderable | FormFieldCallback<FormRenderable, TContext, TDeps>
}
