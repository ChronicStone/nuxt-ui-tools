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
    '#ui-tools': fileURLToPath(new URL('../src/runtime', import.meta.url)),
  },
  modules: [
    '@nuxtjs/i18n',
    fileURLToPath(new URL('../src/module.ts', import.meta.url)),
    './modules/query-devtools',
  ],
  css: [fileURLToPath(new URL('./app/assets/main.css', import.meta.url))],
  devtools: { enabled: true },
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
  vite: {
    optimizeDeps: {
      include: ['@faker-js/faker'],
    },
  },
})
