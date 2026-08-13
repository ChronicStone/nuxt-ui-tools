import type { FormStatefulFieldBase } from '../../types/field-base'
import type { NullableValue } from '../../types/field-output-utils'

export interface FormTextareaField<TContext = {}, TDeps = {}> extends FormStatefulFieldBase<
  'textarea',
  string | null,
  TContext,
  TDeps
> {}

export type TextareaFieldOutput = string | NullableValue
