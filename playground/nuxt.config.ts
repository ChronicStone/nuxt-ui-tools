import { fileURLToPath } from 'node:url'

import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  alias: {
    '#ui-tools': fileURLToPath(new URL('../src/runtime', import.meta.url)),
  },
  app: {
    pageTransition: {
      mode: 'out-in',
      name: 'playground-page',
    },
  },
  compatibilityDate: '2026-03-11',
  css: [fileURLToPath(new URL('app/assets/main.css', import.meta.url))],
  devtools: { enabled: true },
  i18n: {
    defaultLocale: 'en',
    locales: [
      { code: 'en', language: 'en-US', name: 'English' },
      { code: 'fr', language: 'fr-FR', name: 'Français' },
    ],
    strategy: 'no_prefix',
    vueI18n: './i18n.config.ts',
  },
  modules: [
    '@nuxtjs/i18n',
    fileURLToPath(new URL('../src/module.ts', import.meta.url)),
    './modules/query-devtools',
  ],
  nuxtUiTools: {
    global: true,
    prefix: 'Nut',
  },
  ssr: false,
  vite: {
    optimizeDeps: {
      include: ['@faker-js/faker', 'libphonenumber-js'],
    },
  },
})
