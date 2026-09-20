import type { FormStatelessFieldBase } from '../../types/field-base'
import type { FormText } from '../../types/utils'

export interface FormDividerField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> extends FormStatelessFieldBase<'divider', TContext, TDeps> {
  label?: FormText
}
