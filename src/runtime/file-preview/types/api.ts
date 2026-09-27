import type { ComputedRef, Ref, ShallowRef } from 'vue'

import type { MaybePromise } from '../../shared/types/utils'
import type { FilePreviewFile, FilePreviewInput, FilePreviewItem } from './file'
import type { FilePreviewModeInput, FilePreviewRendererDefinition } from './renderer'

export interface FilePreviewOptions {
  /** Opening the same id again updates and keeps the existing preview instead of stacking one. */
  id?: string
  /** File shown first in a gallery. */
  index?: number
  /**
   * Container, or a responsive value such as `fullscreen md:drawer`. Without it, each file's
   * renderer suggests one and the largest wins, so navigating a gallery never swaps containers.
   */
  mode?: FilePreviewModeInput
  /** `strip` shows thumbnails, `counter` only the position. Phones always show the counter. */
  gallery?: 'strip' | 'counter'
  /** Wraps from the last file to the first. */
  loop?: boolean
  /** Page PDFs open at, passed as the `#page=` open parameter. */
  pdf?: { page?: number }
  onChange?: (file: FilePreviewFile, index: number) => void
  onClose?: () => void
}

export interface FilePreviewHandle {
  readonly id: string
  readonly index: Readonly<Ref<number>>
  next: () => void
  previous: () => void
  goTo: (index: number) => void
  /** Replaces the files. The position is kept when it still exists. */
  update: (input: FilePreviewInput | readonly FilePreviewInput[]) => void
  close: () => void
  /** Resolves once the preview has closed and left the screen. */
  readonly closed: Promise<void>
}

export interface FilePreviewInstance {
  readonly id: string
  readonly files: ShallowRef<readonly FilePreviewItem[]>
  readonly index: Ref<number>
  readonly open: Ref<boolean>
  readonly options: FilePreviewOptions
  readonly handle: FilePreviewHandle
  /** Called by the provider once the closing animation ends. */
  dispose: () => void
}

/** Turns markdown into sanitized HTML for the markdown renderer's preview view. */
export type FilePreviewMarkdownRenderer = (source: string) => MaybePromise<string>

export interface FilePreviewApi {
  /**
   * Opens one file or a gallery and returns right away with controls.
   *
   * @example
   * const { $filePreview } = useNuxtApp()
   * $filePreview.open({ src: document.url, name: document.fileName })
   */
  open: (
    input: FilePreviewInput | readonly FilePreviewInput[],
    options?: FilePreviewOptions,
  ) => FilePreviewHandle
  /** Closes the preview with this id, or the top-most one. Returns whether one was open. */
  close: (id?: string) => boolean
  closeAll: () => void
  isOpen: (id?: string) => boolean
  /**
   * Adds a renderer, checked before the built-in ones. Registering a built-in kind replaces it.
   * Returns a function that removes it again.
   */
  register: (renderer: FilePreviewRendererDefinition) => () => void
  readonly instances: ComputedRef<readonly FilePreviewInstance[]>
  readonly renderers: ComputedRef<readonly FilePreviewRendererDefinition[]>
  /** Whether a `<UiFilePreviewProvider>` is mounted to render previews. */
  readonly mounted: ComputedRef<boolean>
  /** Called by the provider. Returns the function it calls when it unmounts. */
  attach: () => () => void
}
