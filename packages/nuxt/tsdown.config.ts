import { fileURLToPath } from 'node:url'
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['./src/module.ts'],
  format: ['esm'],
  outDir: 'dist',
  platform: 'node',
  dts: true,
  sourcemap: true,
  alias: {
    '@lib': fileURLToPath(new URL('./src', import.meta.url)),
  },
  deps: {
    neverBundle: [
      '@nuxt/kit',
      '@nuxt/schema',
      'nuxt',
      '@nuxt-ui-tools/form',
      '@nuxt-ui-tools/shared',
      '@nuxt-ui-tools/table',
    ],
  },
})
