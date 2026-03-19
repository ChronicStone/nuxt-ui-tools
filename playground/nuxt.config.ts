import { fileURLToPath } from 'node:url'

import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: '2026-03-11',
  app: {
    pageTransition: {
      name: 'playground-page',
      mode: 'out-in',
    },
  },
  alias: {
    '#src': fileURLToPath(new URL('../src', import.meta.url)),
    '#runtime': fileURLToPath(new URL('../src/runtime', import.meta.url)),
    '#shared': fileURLToPath(new URL('../src/runtime/shared', import.meta.url)),
    '#query-state': fileURLToPath(new URL('../src/runtime/query-state', import.meta.url)),
    '#table': fileURLToPath(new URL('../src/runtime/table', import.meta.url)),
    '#form': fileURLToPath(new URL('../src/runtime/form', import.meta.url)),
  },
  modules: [
    '@nuxtjs/i18n',
    fileURLToPath(new URL('../src/module.ts', import.meta.url)),
    './modules/query-devtools',
  ],
  css: [fileURLToPath(new URL('./app/assets/main.css', import.meta.url))],
  devtools: { enabled: true },
  vite: {
    optimizeDeps: {
      include: ['@tanstack/vue-query'],
    },
  },
  nuxtUiTools: {
    prefix: 'Nut',
    global: true,
  },
  i18n: {
    defaultLocale: 'en',
    strategy: 'no_prefix',
    langDir: 'locales',
    locales: [
      { code: 'en', name: 'English', file: 'en.json' },
      { code: 'fr', name: 'Français', file: 'fr.json' },
    ],
  },
})
