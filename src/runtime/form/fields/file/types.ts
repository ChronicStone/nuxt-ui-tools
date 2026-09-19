import type { FormStatefulFieldBase } from '../../types/field-base'
import type { FieldProps, NullableValue } from '../../types/field-output-utils'
import type { FormText } from '../../types/utils'

export interface FormFileProps {
  accept?: string
  multiple?: boolean
  directory?: boolean
  dropzoneLabel?: FormText
  dropzoneDescription?: FormText
  icon?: string | false
  variant?: 'area' | 'button'
  layout?: 'list' | 'grid'
  dropzone?: boolean
  preview?: boolean
  interactive?: boolean
}

export type FormFileField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> = FormStatefulFieldBase<'file', File | readonly File[] | null, TContext, TDeps, FormFileProps>

export type FileFieldOutput<TField> =
  FieldProps<TField> extends { multiple: true } ? readonly File[] : File | NullableValue
