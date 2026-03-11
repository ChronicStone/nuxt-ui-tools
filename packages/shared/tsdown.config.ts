import { fileURLToPath } from 'node:url'
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['./src/index.ts'],
  format: ['esm'],
  outDir: 'dist',
  platform: 'neutral',
  dts: true,
  sourcemap: true,
  alias: {
    '@lib': fileURLToPath(new URL('./src', import.meta.url)),
  },
  deps: {
    neverBundle: ['vue'],
  },
})
