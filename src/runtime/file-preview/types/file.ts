import type { MaybePromise } from '../../shared/types/utils'

/** Text shown in the preview chrome. A getter keeps it translated when the language changes. */
export type FilePreviewText = string | (() => string)

/** Kinds the package renders out of the box. Custom renderers may add their own kind names. */
export type FilePreviewBuiltInKind =
  | 'image'
  | 'video'
  | 'audio'
  | 'pdf'
  | 'text'
  | 'csv'
  | 'markdown'
  | 'office'
  | 'archive'
  | 'other'

export type FilePreviewKind = FilePreviewBuiltInKind | (string & {})

/** A usable source: a URL (remote, `data:`, or `blob:`) or the bytes themselves. */
export type FilePreviewSourceValue = string | Blob

/**
 * Where the file comes from. A function runs only when the file is shown, so short-lived signed
 * URLs are requested on demand; it runs again when the user presses Retry after an error.
 */
export type FilePreviewSource =
  | FilePreviewSourceValue
  | (() => MaybePromise<FilePreviewSourceValue>)

export interface FilePreviewDetail {
  label: FilePreviewText
  value: FilePreviewText
}

/** Extra header action, such as "Open in registry". */
export interface FilePreviewAction {
  label: FilePreviewText
  icon?: string
  /** Link target. External URLs open in a new tab. */
  to?: string
  onSelect?: (file: FilePreviewFile) => MaybePromise<void>
}

/** Caption or subtitle track for video previews. */
export interface FilePreviewTrack {
  src: string
  srcLang: string
  label: string
  kind?: TextTrackKind
  default?: boolean
}

export interface FilePreviewFile {
  src: FilePreviewSource
  /** Stable identity inside a gallery. Defaults to the file position. */
  id?: string
  /** Display name. Defaults to `File.name`, then the last URL segment. */
  name?: string
  /** MIME type. Wins over extension sniffing to pick the renderer. */
  mime?: string
  /** Forces a renderer, custom kinds included. */
  kind?: FilePreviewKind
  size?: number
  updatedAt?: string | number | Date
  /** Small image for the gallery strip. */
  thumbnail?: string
  /** Video poster or audio cover. */
  poster?: string
  /**
   * Preview made by a server for a file browsers cannot render, such as a PDF for a DOCX or a JPEG
   * for a HEIC photo. The preview shows the rendition and downloads keep the original.
   */
  rendition?: FilePreviewFile
  details?: readonly FilePreviewDetail[]
  /**
   * `false` hides the download action, a string downloads that URL instead, and a function replaces
   * the download entirely. By default the resolved source is downloaded under the file name.
   */
  download?: boolean | string | ((file: FilePreviewFile) => MaybePromise<void>)
  actions?: readonly FilePreviewAction[]
  tracks?: readonly FilePreviewTrack[]
}

/** What `open()` accepts for each file: a URL, a `File` or `Blob`, or a full descriptor. */
export type FilePreviewInput = FilePreviewSourceValue | FilePreviewFile

/** A file normalized once when the preview opens. Renderers receive it as `file`. */
export interface FilePreviewItem {
  key: string
  file: FilePreviewFile
  name: string
  mime: string | null
  extension: string | null
  size: number | null
  updatedAt: Date | null
  kind: FilePreviewKind
  rendition: FilePreviewItem | null
}
