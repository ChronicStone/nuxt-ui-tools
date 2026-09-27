import { defineNuxtPlugin } from '#app'

import { createFilePreviewApi, filePreviewApiKey } from '../composables/use-file-preview-api'

/**
 * One file preview API for the whole app: components reach it with `useFilePreview()`, and code
 * running outside setup (actions, stores) with `useNuxtApp().$filePreview`.
 * `<UiFilePreviewProvider>` renders the previews it opens.
 */
export default defineNuxtPlugin({
  name: 'nuxt-ui-tools:file-preview-api',
  setup(nuxtApp) {
    const filePreview = createFilePreviewApi()
    nuxtApp.vueApp.provide(filePreviewApiKey, filePreview)

    return { provide: { filePreview } }
  },
})
