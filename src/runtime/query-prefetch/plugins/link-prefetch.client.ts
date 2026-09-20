import { defineNuxtPlugin } from '#app'

import { prefetchPage } from '../utils/prefetch-page'

export default defineNuxtPlugin<Record<never, never>>({
  name: 'nuxt-ui-tools:query-prefetch',
  setup(nuxtApp) {
    nuxtApp.hook('link:prefetch', (to) => nuxtApp.runWithContext(() => prefetchPage(to)))
  },
})
