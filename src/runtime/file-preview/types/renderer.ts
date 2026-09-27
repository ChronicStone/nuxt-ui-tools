import type { Component } from 'vue'

import type { FilePreviewDetail, FilePreviewItem, FilePreviewKind, FilePreviewText } from './file'

/** Overlay that hosts a preview. The same three containers forms use. */
export type FilePreviewContainer = 'modal' | 'drawer' | 'fullscreen'

/** A container, or a responsive value such as `fullscreen md:drawer`. */
export type FilePreviewModeInput = FilePreviewContainer | (string & {})

/** What detection sees of a file. */
export interface FilePreviewMatchContext {
  name: string
  mime: string | null
  extension: string | null
}

export type FilePreviewRendererLoader = () => Promise<Component | { default: Component }>

export interface FilePreviewRendererDefinition<TKind extends FilePreviewKind = FilePreviewKind> {
  kind: TKind
  /** Icon of the kind tile, strip tile, and fallback glyph. */
  icon: string
  /** Kind name shown in the meta line. Built-in kinds are translated by the package. */
  label?: FilePreviewText
  /** Claims files for this renderer. Files that set `kind` skip matching. */
  match?: (file: FilePreviewMatchContext) => boolean
  /** Loaded the first time a file of this kind is shown: `() => import('./EmailPreview.vue')`. */
  component: FilePreviewRendererLoader
  /** Default container when `open()` has no `mode`. */
  mode?: FilePreviewModeInput
  /** Uses a narrow modal for a single file, as audio and the fallback card do. */
  compact?: boolean
}

export type FilePreviewErrorReason = 'source' | 'decode' | 'unsupported'

export interface FilePreviewRendererError {
  reason: FilePreviewErrorReason
  message?: string
}

/** Props every renderer receives. */
export interface FilePreviewRendererProps {
  file: FilePreviewItem
  /** Usable URL: the resolved URL, or an object URL for `Blob` sources. */
  url: string
  /** Bytes when the source is a `Blob`, so text renderers can read them without a request. */
  blob: Blob | null
  container: FilePreviewContainer
}

export interface FilePreviewRendererEmits {
  /** Content is on screen. Details such as dimensions or duration join the details panel. */
  ready: [details?: readonly FilePreviewDetail[]]
  error: [error: FilePreviewRendererError]
}
