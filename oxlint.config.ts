import { defineConfig } from 'oxlint'
import antiSlop from 'ultracite/oxlint/anti-slop'
import core from 'ultracite/oxlint/core'

export default defineConfig({
  categories: {
    correctness: 'error',
    suspicious: 'warn',
  },
  env: {
    browser: true,
    node: true,
  },
  extends: [antiSlop],
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
  plugins: ['import', 'promise', 'vue'],
  rules: {
    'anti-slop/no-chained-type-assertions': 'warn',
    'anti-slop/no-conditional-empty-object-spread': 'warn',
    'anti-slop/no-known-value-widening': 'warn',
    'anti-slop/no-module-mocking': 'warn',
    'anti-slop/no-object-parameters': 'warn',
    'anti-slop/no-reflect-apply': 'warn',
    'anti-slop/no-reflect-get': 'warn',
    'anti-slop/no-runtime-typeof': 'warn',
    'anti-slop/no-shape-in-symbol-names': 'warn',
    'anti-slop/no-unknown-parameters': 'warn',
    'anti-slop/no-unknown-returns': 'warn',
    'anti-slop/no-unknown-type-aliases': 'warn',
    'anti-slop/no-unsafe-dictionary-type': 'warn',
    'anti-slop/no-widen-then-assert': 'warn',
    'anti-slop/require-safety-comment-for-type-assertion': 'warn',
    'typescript/consistent-indexed-object-style': 'warn',
    'unicorn/no-immediate-mutation': 'warn',
    'unicorn/prefer-reflect-apply': 'warn',
  },
})
