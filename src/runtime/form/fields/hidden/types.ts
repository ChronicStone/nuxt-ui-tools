import type { FormValue } from '../../types'
import type { FormStatefulFieldBase } from '../../types/field-base'
import type { FieldDefaultValue, FallbackNever } from '../../types/field-output-utils'

export interface FormHiddenField<TContext = {}, TDeps = {}> extends Pick<
  FormStatefulFieldBase<'hidden', FormValue, TContext, TDeps>,
  | 'key'
  | 'type'
  | 'default'
  | 'dependencies'
  | 'condition'
  | 'validation'
  | 'transform'
  | 'submit'
  | 'ignore'
> {}

export type HiddenFieldOutput<TField> = FallbackNever<FieldDefaultValue<TField>, FormValue>
