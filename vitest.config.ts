import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '#src': new URL('./src', import.meta.url).pathname,
      '#runtime': new URL('./src/runtime', import.meta.url).pathname,
      '#shared': new URL('./src/runtime/shared', import.meta.url).pathname,
      '#query-state': new URL('./src/runtime/query-state', import.meta.url).pathname,
      '#table': new URL('./src/runtime/table', import.meta.url).pathname,
      '#form': new URL('./src/runtime/form', import.meta.url).pathname,
    },
  },
  test: {
    include: ['test/**/*.test.ts'],
    exclude: ['test/fixtures/**'],
  },
})
