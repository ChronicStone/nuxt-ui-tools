import { fileURLToPath } from 'node:url'

import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  alias: {
    '#ui-tools': fileURLToPath(new URL('../src/runtime', import.meta.url)),
  },
  app: {
    head: {
      meta: [
        { content: 'width=device-width, initial-scale=1, viewport-fit=cover', name: 'viewport' },
      ],
    },
  },
  compatibilityDate: '2026-03-11',
  css: [fileURLToPath(new URL('app/assets/main.css', import.meta.url))],
  devtools: { enabled: false },
  i18n: {
    defaultLocale: 'fr',
    // The pages are a French product mock: follow `defaultLocale`, not the browser language.
    detectBrowserLanguage: false,
    locales: [
      { code: 'fr', language: 'fr-FR', name: 'Français' },
      { code: 'en', language: 'en-US', name: 'English' },
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
      include: [
        '@faker-js/faker',
        // Dashboard charts load lazily; pre-bundling avoids a reload the first time one renders.
        '@unovis/ts',
        '@unovis/vue/components/area',
        '@unovis/vue/components/axis',
        '@unovis/vue/components/crosshair',
        '@unovis/vue/components/donut',
        '@unovis/vue/components/grouped-bar',
        '@unovis/vue/components/line',
        '@unovis/vue/components/plotline',
        '@unovis/vue/components/scatter',
        '@unovis/vue/components/stacked-bar',
        '@unovis/vue/components/tooltip',
        '@unovis/vue/containers/single-container',
        '@unovis/vue/containers/xy-container',
      ],
    },
  },
})
