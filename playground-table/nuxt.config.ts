import { fileURLToPath } from 'node:url'

import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  ssr: false,
  app: {
    head: {
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }],
    },
  },
  compatibilityDate: '2026-03-11',
  alias: {
    '#ui-tools': fileURLToPath(new URL('../src/runtime', import.meta.url)),
  },
  modules: ['@nuxtjs/i18n', fileURLToPath(new URL('../src/module.ts', import.meta.url))],
  css: [fileURLToPath(new URL('./app/assets/main.css', import.meta.url))],
  devtools: { enabled: false },
  icon: { clientBundle: { scan: true, sizeLimitKb: 512 } },
  nuxtUiTools: {
    prefix: 'Nut',
    global: true,
  },
  i18n: {
    vueI18n: './i18n.config.ts',
    defaultLocale: 'fr',
    strategy: 'no_prefix',
    locales: [
      { code: 'fr', name: 'Français', language: 'fr-FR' },
      { code: 'en', name: 'English', language: 'en-US' },
    ],
  },
  vite: {
    optimizeDeps: {
      include: ['@faker-js/faker'],
    },
  },
})
