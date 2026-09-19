import type { FormStatelessFieldBase } from '../../types/field-base'
import type { FormText } from '../../types/utils'

/**
 * Section caption: a small uppercase title with optional supporting copy, separated from the
 * previous fields by a hairline. Spans the full grid by default.
 */
export interface FormSectionField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> extends FormStatelessFieldBase<'section', TContext, TDeps> {
  label: FormText
  description?: FormText
}
