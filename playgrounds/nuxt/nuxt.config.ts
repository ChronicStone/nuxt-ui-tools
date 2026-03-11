import { fileURLToPath } from 'node:url'

import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2026-03-11',
  modules: [
    '@nuxt/ui',
    '@nuxtjs/i18n',
    fileURLToPath(new URL('../../packages/nuxt/src/module.ts', import.meta.url)),
  ],
  css: ['./app/assets/main.css'],
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
})
