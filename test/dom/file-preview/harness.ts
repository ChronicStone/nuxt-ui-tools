import { flushPromises, mount } from '@vue/test-utils'
import { h } from 'vue'

import FilePreviewProvider from '#ui-tools/file-preview/components/provider/file-preview-provider.vue'
import {
  createFilePreviewApi,
  filePreviewApiKey,
} from '#ui-tools/file-preview/composables/use-file-preview-api'
import type { FilePreviewMarkdownRenderer } from '#ui-tools/file-preview/types'

async function until(condition: () => boolean, label = 'condition') {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (condition()) return
    // oxlint-disable-next-line no-await-in-loop -- polling until the condition holds
    await flushPromises()
    // oxlint-disable-next-line no-await-in-loop -- polling until the condition holds
    await new Promise((resolve) => setTimeout(resolve, 5))
  }
  throw new Error(`Timed out waiting for ${label}`)
}

/** Mounts a provider around an app-wide API, the way the module plugin provides it. */
export function mountFilePreview(options: { markdown?: FilePreviewMarkdownRenderer } = {}) {
  const api = createFilePreviewApi()
  const wrapper = mount(
    () =>
      h(FilePreviewProvider, { markdown: options.markdown }, { default: () => h('main', 'app') }),
    {
      attachTo: document.body,
      // SAFETY: an InjectionKey is a symbol at runtime; TypeScript only rejects its interface type as a key.
      global: { provide: { [filePreviewApiKey as symbol]: api } },
    },
  )

  return {
    api,
    find: (selector: string) => wrapper.find(selector),
    text: (selector: string) => wrapper.find(selector).text(),
    unmount: () => wrapper.unmount(),
    until,
    wrapper,
  }
}
