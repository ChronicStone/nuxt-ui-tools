import { defineConfig } from 'oxlint'
import antiSlop from 'ultracite/oxlint/anti-slop'
import core from 'ultracite/oxlint/core'
import vitest from 'ultracite/oxlint/vitest'
import vue from 'ultracite/oxlint/vue'

export default defineConfig({
  extends: [core, vue, vitest, antiSlop],
  ignorePatterns: [
    ...core.ignorePatterns,
    '**/.nuxt/**',
    '**/.output/**',
    '**/.turbo/**',
    'coverage/**',
    '.claude/**',
    '.codex/**',
    '.cursor/**',
    'dist/**',
  ],
})
