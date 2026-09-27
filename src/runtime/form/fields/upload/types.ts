import type { FormValue } from '../../types'
import type { FormFieldCallbackParams } from '../../types/callbacks'
import type { FormStatefulFieldBase } from '../../types/field-base'
import type { FieldProps, NullableValue } from '../../types/field-output-utils'
import type { FormMaybePromise, FormObject, FormText } from '../../types/utils'

/**
 * One stored upload value: the URL string or the object returned by the upload handler.
 */
export type FormUploadValue = string | FormObject

export interface FormUploadCallbackParams<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> extends FormFieldCallbackParams<TContext, TDeps> {
  /** Files handled by this call. The field calls the handler once per selected file. */
  files: readonly File[]
  /** Reports the progress of this upload, from `0` to `100`. */
  onProgress: (percent: number) => void
  /** Aborted when the user cancels the upload or removes the file while it uploads. */
  signal: AbortSignal
}

/**
 * Uploads the selected file and returns the value stored in the form.
 * When an array is returned for a single file, its first item is stored.
 */
export type FormUploadHandler<TContext = NonNullable<unknown>, TDeps = NonNullable<unknown>> = (
  params: FormUploadCallbackParams<TContext, TDeps>,
) => Promise<FormUploadValue | readonly FormUploadValue[] | null>

/**
 * Display data for a stored upload value, used to render files that are already set.
 */
export interface FormUploadResolvedFile {
  /** File name shown in the list. */
  name: string
  /** Size in bytes, shown next to the file type when provided. */
  size?: number | null
  /** MIME type, used for the file icon and image previews. */
  type?: string | null
  /** Link opened by the open action when no `upload.open` hook is configured. */
  url?: string | null
  /** Image preview source. Defaults to `url` for image types. */
  thumbnail?: string | null
  /** Replaces the file type and size line under the name, for example with an upload date. */
  description?: string | null
  /**
   * Shows the open action for this file. Defaults to `true` when an `upload.open` hook or a
   * `url` is available.
   */
  openable?: boolean
}

export interface FormUploadValueParams<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> extends FormFieldCallbackParams<TContext, TDeps> {
  /** The stored value being resolved or opened. */
  value: FormUploadValue
}

export interface FormUploadOpenParams<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> extends FormUploadValueParams<TContext, TDeps> {
  /** Display data resolved for the stored value. */
  file: FormUploadResolvedFile
}

export interface FormUploadDeleteParams<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> extends FormFieldCallbackParams<TContext, TDeps> {
  value: FormValue
}

export interface FormUploadProps {
  multiple?: boolean
  /** Maximum number of stored and pending files when `multiple` is enabled. */
  max?: number
  accept?: string
  /** Uploads files as soon as they are selected. Defaults to `true`. */
  autoUpload?: boolean
  dropzoneLabel?: FormText
  dropzoneDescription?: FormText
  icon?: string | false
  /** `button` renders a compact picker, suited to table cells. Ignored when `multiple` is set. */
  variant?: 'area' | 'button'
  layout?: 'list' | 'grid'
  /** Shows image thumbnails for image files. Defaults to `true`. */
  preview?: boolean
}

export interface FormUploadField<
  TContext = NonNullable<unknown>,
  TDeps = NonNullable<unknown>,
> extends FormStatefulFieldBase<
  'upload',
  FormUploadValue | readonly FormUploadValue[] | null,
  TContext,
  TDeps,
  FormUploadProps
> {
  output: 'url' | 'object'
  upload: {
    handler: FormUploadHandler<TContext, TDeps>
    /**
     * Resolves display data for a stored value so files that are already set render with
     * their name, size, and preview. Without it, string values use their last URL segment as
     * the name and the value as the link; object values read their `name`, `size`, `type`,
     * `url`, and `thumbnail` keys.
     *
     * @example
     * resolve: async ({ value }) => {
     *   const file = await api.files.show(String(value))
     *   return { name: file.name, size: file.size, type: file.mimeType }
     * }
     */
    resolve?: (
      params: FormUploadValueParams<TContext, TDeps>,
    ) => FormMaybePromise<FormUploadResolvedFile | null>
    /**
     * Opens a stored file, for example through a short-lived download link.
     * Defaults to opening the resolved `url` in a new tab.
     */
    open?: (params: FormUploadOpenParams<TContext, TDeps>) => FormMaybePromise<void>
    onDelete?: (params: FormUploadDeleteParams<TContext, TDeps>) => Promise<void> | void
  }
}

export type UploadFieldOutput<TField> = TField extends { output: 'object' }
  ? FieldProps<TField> extends { multiple: true }
    ? readonly FormObject[] | NullableValue
    : FormObject | NullableValue
  : FieldProps<TField> extends { multiple: true }
    ? readonly string[] | NullableValue
    : string | NullableValue
