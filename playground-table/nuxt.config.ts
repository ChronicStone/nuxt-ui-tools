import { fileURLToPath } from 'node:url'

import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  alias: {
    '#ui-tools': fileURLToPath(new URL('../src/runtime', import.meta.url)),
  },
  app: {
    head: {
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      ],
    },
  },
  compatibilityDate: '2026-03-11',
  css: [fileURLToPath(new URL('./app/assets/main.css', import.meta.url))],
  devtools: { enabled: false },
  i18n: {
    defaultLocale: 'fr',
    locales: [
      { code: 'fr', name: 'Français', language: 'fr-FR' },
      { code: 'en', name: 'English', language: 'en-US' },
    ],
    strategy: 'no_prefix',
    vueI18n: './i18n.config.ts',
  },
  icon: { clientBundle: { scan: true, sizeLimitKb: 512 } },
  modules: ['@nuxtjs/i18n', fileURLToPath(new URL('../src/module.ts', import.meta.url))],
  nuxtUiTools: {
    global: true,
    prefix: 'Nut',
  },
  ssr: false,
  vite: {
    optimizeDeps: {
      include: ['@faker-js/faker'],
    },
  },
})
