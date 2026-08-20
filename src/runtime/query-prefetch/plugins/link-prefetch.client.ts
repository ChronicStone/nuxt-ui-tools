import { defineNuxtPlugin } from 'nuxt/app'

import { prefetchPage } from '../utils/prefetch-page'

export default defineNuxtPlugin({
  name: 'nuxt-ui-tools:query-prefetch',
  setup(nuxtApp) {
    nuxtApp.hook('link:prefetch', (to) => nuxtApp.runWithContext(() => prefetchPage(to)))
  },
})
