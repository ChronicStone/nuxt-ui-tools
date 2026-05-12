import type { FormStatelessFieldBase } from '../../types/field-base'
import type { FormText } from '../../types/utils'

export interface FormDividerField<TContext = {}, TDeps = {}>
  extends FormStatelessFieldBase<'divider', TContext, TDeps> {
  label?: FormText
}
