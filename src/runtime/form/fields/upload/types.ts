import type { FormFieldCallbackParams } from '../../types/callbacks'
import type { FormStatefulFieldBase } from '../../types/field-base'
import type { NullableValue } from '../../types/field-output-utils'
import type { FormObject } from '../../types/utils'

export interface FormUploadCallbackParams<
  TContext = {},
  TDeps = {},
> extends FormFieldCallbackParams<TContext, TDeps> {
  files: readonly File[]
}

export type FormUploadHandler<TContext = {}, TDeps = {}> = (
  params: FormUploadCallbackParams<TContext, TDeps>,
) => Promise<string | FormObject | readonly string[] | readonly FormObject[] | null>

export interface FormUploadDeleteParams<TContext = {}, TDeps = {}> extends FormFieldCallbackParams<
  TContext,
  TDeps
> {
  value: unknown
}

export interface FormUploadField<TContext = {}, TDeps = {}> extends FormStatefulFieldBase<
  'upload',
  string | FormObject | readonly string[] | readonly FormObject[] | null,
  TContext,
  TDeps
> {
  output: 'url' | 'object'
  multiple?: boolean
  accept?: string
  autoUpload?: boolean
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
