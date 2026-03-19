import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '#ui-tools': new URL('./src/runtime', import.meta.url).pathname,
    },
  },
  test: {
    include: ['test/**/*.test.ts'],
    exclude: ['test/fixtures/**'],
  },
})
