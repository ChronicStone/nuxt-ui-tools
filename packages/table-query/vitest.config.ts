import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@nuxt-ui-tools/shared': new URL('../shared/src/index.ts', import.meta.url).pathname,
      '@nuxt-ui-tools/table-core': new URL('../table-core/src/index.ts', import.meta.url).pathname,
    },
  },
  test: {
    include: ['test/**/*.test.ts'],
  },
})
