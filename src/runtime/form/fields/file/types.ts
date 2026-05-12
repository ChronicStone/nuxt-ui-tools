import type { FormStatefulFieldBase } from '../../types/field-base'
import type { NullableValue } from '../../types/field-output-utils'

export interface FormFileField<TContext = {}, TDeps = {}>
  extends FormStatefulFieldBase<'file', File | readonly File[] | null, TContext, TDeps> {
  accept?: string
  multiple?: boolean
  directory?: boolean
}

export type FileFieldOutput<TField> = TField extends { multiple: true }
  ? readonly File[]
  : File | NullableValue
