import { getCurrentInstance, inject } from 'vue'

import { filePreviewApiKey } from '../../file-preview/composables/use-file-preview-api'
import type { FilePreviewFile } from '../../file-preview/types'

/**
 * Opens files in the app's file preview when one is provided; returns `false` otherwise so the
 * caller can fall back to a plain link.
 */
export function useDisplayFilePreview() {
  const api = getCurrentInstance() ? inject(filePreviewApiKey, null) : null

  function open(files: readonly FilePreviewFile[], index = 0) {
    if (!api || !files.length) return false
    api.open(files, { index })
    return true
  }

  return { available: Boolean(api), open }
}
