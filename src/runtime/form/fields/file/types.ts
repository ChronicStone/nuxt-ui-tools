import type { FormStatefulFieldBase } from '../../types/field-base'
import type { NullableValue } from '../../types/field-output-utils'
import type { FormText } from '../../types/utils'

export interface FormFileField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> extends FormStatefulFieldBase<'file', File | readonly File[] | null, TContext, TDeps> {
  accept?: string
  multiple?: boolean
  directory?: boolean
  dropzoneLabel?: FormText
  dropzoneDescription?: FormText
  icon?: string | false
  variant?: 'area' | 'button'
  fileLayout?: 'list' | 'grid'
  dropzone?: boolean
  preview?: boolean
  interactive?: boolean
}

export type FileFieldOutput<TField> = TField extends { multiple: true }
  ? readonly File[]
  : File | NullableValue
