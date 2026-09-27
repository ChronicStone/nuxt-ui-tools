import type { ComputedRef, Ref } from 'vue'

import type { FilePreviewMarkdownRenderer, FilePreviewOptions } from './api'

/** What the preview shell shares with the renderer it shows. */
export interface FilePreviewShellContext {
  /** Dialog root. Renderers listen to its `keydown` for their own shortcuts. */
  root: Readonly<Ref<HTMLElement | null>>
  /** Where `<UiFilePreviewTools>` puts renderer buttons: the header, or the bottom bar on phones. */
  tools: Readonly<Ref<HTMLElement | null>>
  narrow: ComputedRef<boolean>
  options: FilePreviewOptions
  markdown: FilePreviewMarkdownRenderer | null
}
