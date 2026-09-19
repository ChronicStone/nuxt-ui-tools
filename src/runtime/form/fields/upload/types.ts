import type { FormValue } from '../../types'
import type { FormFieldCallbackParams } from '../../types/callbacks'
import type { FormStatefulFieldBase } from '../../types/field-base'
import type { NullableValue } from '../../types/field-output-utils'
import type { FormObject, FormText } from '../../types/utils'

export interface FormUploadCallbackParams<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> extends FormFieldCallbackParams<TContext, TDeps> {
  files: readonly File[]
  onProgress: (percent: number) => void
}

export type FormUploadHandler<TContext = NonNullable<unknown>, TDeps = NonNullable<unknown>> = (
  params: FormUploadCallbackParams<TContext, TDeps>,
) => Promise<string | FormObject | readonly string[] | readonly FormObject[] | null>

export interface FormUploadDeleteParams<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> extends FormFieldCallbackParams<TContext, TDeps> {
  value: FormValue
}

export interface FormUploadField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> extends FormStatefulFieldBase<
  'upload',
  string | FormObject | readonly string[] | readonly FormObject[] | null,
  TContext,
  TDeps
> {
  output: 'url' | 'object'
  multiple?: boolean
  accept?: string
  autoUpload?: boolean
  dropzoneLabel?: FormText
  dropzoneDescription?: FormText
  icon?: string | false
  variant?: 'area' | 'button'
  fileLayout?: 'list' | 'grid'
  preview?: boolean
  upload: {
    handler: FormUploadHandler<TContext, TDeps>
    onDelete?: (params: FormUploadDeleteParams<TContext, TDeps>) => Promise<void> | void
  }
}

export type UploadFieldOutput<TField> = TField extends { output: 'object' }
  ? TField extends { multiple: true }
    ? readonly FormObject[] | NullableValue
    : FormObject | NullableValue
  : TField extends { multiple: true }
    ? readonly string[] | NullableValue
    : string | NullableValue
