import { fileExtension, fileNameFromUrl } from '../../shared/utils/file'
import { isString } from '../../shared/utils/predicate'
import type {
  FilePreviewFile,
  FilePreviewInput,
  FilePreviewItem,
  FilePreviewRendererDefinition,
  FilePreviewSource,
} from '../types'
import { detectFilePreviewKind } from './renderers'

function isBlob(value: FilePreviewInput | FilePreviewSource): value is Blob {
  return 'Blob' in globalThis && value instanceof Blob
}

function isNamedFile(value: FilePreviewSource): value is File {
  return 'File' in globalThis && value instanceof File
}

function toFile(input: FilePreviewInput): FilePreviewFile {
  if (isString(input) || isBlob(input)) return { src: input }
  return input
}

function sourceName(src: FilePreviewSource) {
  if (isNamedFile(src)) return src.name
  if (isString(src) && !src.startsWith('data:') && !src.startsWith('blob:'))
    return fileNameFromUrl(src)
  return ''
}

function toDate(value: FilePreviewFile['updatedAt'], src: FilePreviewSource) {
  if (value !== undefined) {
    const date = value instanceof Date ? value : new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  }
  return isNamedFile(src) ? new Date(src.lastModified) : null
}

/** Normalizes one input: names, MIME type, size, and kind are settled once, when the preview opens. */
export function normalizeFilePreviewItem(
  input: FilePreviewInput,
  context: { key: string; renderers: readonly FilePreviewRendererDefinition[] },
): FilePreviewItem {
  const file = toFile(input)
  const name = file.name ?? sourceName(file.src)
  const blob = isBlob(file.src) ? file.src : null
  const mime = file.mime ?? (blob?.type || null)
  const extension = fileExtension(name)

  return {
    extension,
    file,
    key: file.id ?? context.key,
    kind: detectFilePreviewKind({ extension, kind: file.kind, mime, name }, context.renderers),
    mime,
    name,
    rendition: file.rendition
      ? normalizeFilePreviewItem(file.rendition, { ...context, key: `${context.key}:rendition` })
      : null,
    size: file.size ?? blob?.size ?? null,
    updatedAt: toDate(file.updatedAt, file.src),
  }
}

export function normalizeFilePreviewItems(
  input: FilePreviewInput | readonly FilePreviewInput[],
  renderers: readonly FilePreviewRendererDefinition[],
) {
  const inputs: readonly FilePreviewInput[] = isInputList(input) ? input : [input]
  return inputs.map((entry, index) =>
    normalizeFilePreviewItem(entry, { key: `file-${index}`, renderers }),
  )
}

function isInputList(
  input: FilePreviewInput | readonly FilePreviewInput[],
): input is readonly FilePreviewInput[] {
  return Array.isArray(input)
}
