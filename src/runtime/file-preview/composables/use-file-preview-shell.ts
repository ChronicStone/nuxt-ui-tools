import { useEventListener } from '@vueuse/core'
import { inject } from 'vue'
import type { InjectionKey } from 'vue'

import type { FilePreviewMarkdownRenderer, FilePreviewShellContext } from '../types'

export const filePreviewShellKey: InjectionKey<FilePreviewShellContext> = Symbol(
  'nuxt-ui-tools-file-preview-shell',
)

export const filePreviewMarkdownKey: InjectionKey<FilePreviewMarkdownRenderer | null> = Symbol(
  'nuxt-ui-tools-file-preview-markdown',
)

const KEY_OWNERS =
  'input, textarea, select, iframe, [contenteditable="true"], [role="slider"], [role="menu"], [role="menuitem"]'

/** Whether a key press belongs to the focused control rather than to the preview. */
export function isFilePreviewControlKey(event: KeyboardEvent) {
  if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return true
  const target = event.target instanceof Element ? event.target : null
  if (!target) return false
  if (target.closest(KEY_OWNERS)) return true
  return (event.key === ' ' || event.key === 'Enter') && target.closest('button, a') !== null
}

/** Shell of the preview the calling renderer is shown in. */
export function useFilePreviewShell() {
  const shell = inject(filePreviewShellKey, null)
  if (!shell)
    throw new Error('useFilePreviewShell() must be called inside a file preview renderer.')
  return shell
}

/**
 * Runs `handler` for the given keys while the preview has focus, except when a field, slider, menu,
 * or embedded document owns the key.
 */
export function onFilePreviewKey(keys: readonly string[], handler: (event: KeyboardEvent) => void) {
  const shell = useFilePreviewShell()
  useEventListener(shell.root, 'keydown', (event: KeyboardEvent) => {
    if (!keys.includes(event.key) || isFilePreviewControlKey(event)) return
    event.preventDefault()
    handler(event)
  })
}
