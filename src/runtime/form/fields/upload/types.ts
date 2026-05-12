import type { FormFieldCallback } from '../../types/callbacks'
import type { FormStatefulFieldBase } from '../../types/field-base'
import type { FormObject } from '../../types/utils'
import type { NullableValue } from '../../types/field-output-utils'

export interface FormUploadField<TContext = {}, TDeps = {}>
  extends FormStatefulFieldBase<'upload', string | FormObject | readonly string[] | readonly FormObject[] | null, TContext, TDeps> {
  output: 'url' | 'object'
  multiple?: boolean
  accept?: string
  upload: {
    handler: FormFieldCallback<Promise<string | FormObject | readonly string[] | readonly FormObject[] | null>, TContext, TDeps>
    onDelete?: FormFieldCallback<Promise<void> | void, TContext, TDeps>
  }
}

export type UploadFieldOutput<TField> = TField extends { output: 'object' }
  ? TField extends { multiple: true }
    ? readonly FormObject[] | NullableValue
    : FormObject | NullableValue
  : TField extends { multiple: true }
    ? readonly string[] | NullableValue
    : string | NullableValue
