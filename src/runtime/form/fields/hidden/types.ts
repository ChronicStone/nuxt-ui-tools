import type { FormStatefulFieldBase } from '../../types/field-base'
import type { FieldDefaultValue, FallbackNever } from '../../types/field-output-utils'

export interface FormHiddenField<TContext = {}, TDeps = {}> extends Pick<
  FormStatefulFieldBase<'hidden', unknown, TContext, TDeps>,
  'key' | 'type' | 'default' | 'dependencies' | 'condition' | 'validation' | 'transform' | 'submit'
> {}

export type HiddenFieldOutput<TField> = FallbackNever<FieldDefaultValue<TField>, unknown>
