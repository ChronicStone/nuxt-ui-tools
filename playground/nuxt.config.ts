import { fileURLToPath } from 'node:url'

import { defineNuxtConfig } from 'nuxt/config'

/** `PLAYGROUND_SSR=1` builds the playground with server rendering, next to the client-only build. */
const ssr = process.env.PLAYGROUND_SSR === '1'

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
  debug: ssr ? { hydration: true } : false,
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
  nitro: ssr ? { output: { dir: fileURLToPath(new URL('.build-ssr', import.meta.url)) } } : {},
  nuxtUiTools: {
    global: true,
    prefix: 'Nut',
  },
  ssr,
  vite: {
    optimizeDeps: {
      include: ['@faker-js/faker', 'libphonenumber-js'],
    },
  },
})
