import type { GenericObject } from '../../shared/types/utils'
import { isFunction, isString } from '../../shared/utils/predicate'
import type { FilePreviewSourceFailure, FilePreviewText } from '../types'

/**
 * Error a source function throws when the app knows why the file is unavailable. The preview shows
 * its `title` and `description` in place of the generic ones, without the raw error message.
 *
 * @example
 * ```ts
 * src: async () => {
 *   const response = await fetch(`/api/invoices/${id}/file`)
 *   if (response.status === 404)
 *     throw new FilePreviewSourceError({ description: 'The invoice file cannot be found.' })
 *   return (await response.json()).url
 * }
 * ```
 */
export class FilePreviewSourceError extends Error implements FilePreviewSourceFailure {
  readonly title?: FilePreviewText
  readonly description?: FilePreviewText

  constructor(options: {
    title?: FilePreviewText
    description?: FilePreviewText
    message?: string
  }) {
    super(
      options.message ??
        textOf(options.description) ??
        textOf(options.title) ??
        'File source failed',
    )
    this.name = 'FilePreviewSourceError'
    this.title = options.title
    this.description = options.description
  }
}

/** The title and description a thrown source error carries, if any, resolved to text. */
export function explainFilePreviewFailure(cause: Error | GenericObject) {
  const title = 'title' in cause ? textOf(cause.title) : undefined
  const description = 'description' in cause ? textOf(cause.description) : undefined
  return title === undefined && description === undefined ? null : { description, title }
}

function textOf(value: GenericObject[string]) {
  if (isString(value)) return value
  if (isFunction(value)) {
    const text = value()
    return isString(text) ? text : undefined
  }
  return undefined
}
