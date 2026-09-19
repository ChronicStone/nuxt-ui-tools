import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { defineConfig } from 'vitest/config'

const root = new URL('./', import.meta.url).pathname

export default defineConfig({
  plugins: [vue(), vueJsx()],
  resolve: {
    alias: [
      { find: /^#ui-tools\/(.*)$/, replacement: `${root}src/runtime/$1` },
      { find: /^nuxt\/app$/, replacement: `${root}test/dom/stubs/nuxt-app.ts` },
      {
        find: /^@nuxt\/ui\/composables\/useLocale$/,
        replacement: `${root}test/dom/stubs/nuxt-ui-locale.ts`,
      },
      {
        find: /^@nuxt\/ui\/components\/(.*)\.vue$/,
        replacement: `${root}test/dom/stubs/nuxt-ui/$1.ts`,
      },
      { find: /^vue-draggable-plus$/, replacement: `${root}test/dom/stubs/vue-draggable-plus.ts` },
    ],
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          exclude: ['test/fixtures/**', 'test/dom/**'],
          include: ['test/**/*.test.ts'],
          name: 'unit',
        },
      },
      {
        extends: true,
        test: {
          environment: 'happy-dom',
          include: ['test/dom/**/*.test.ts'],
          name: 'dom',
          setupFiles: ['test/dom/setup.ts'],
        },
      },
    ],
  },
})
