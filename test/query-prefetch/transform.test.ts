import typescript from 'typescript'
import { describe, expect, it } from 'vitest'

import { transformQueryPrefetchMacro } from '../../src/internals/query-prefetch-transform'

const transform = (source: string) =>
  transformQueryPrefetchMacro(typescript, source, '/app/pages/products/[id].vue')

describe('query prefetch page macro', () => {
  it('adds the definition to existing object page metadata', () => {
    const source = `<script setup lang="ts">
defineQueryPrefetch('products-id', ({ route }) => productQuery(route.params.id))

definePageMeta({
  layout: 'catalog',
})
</script>`

    expect(transform(source)).toContain(`definePageMeta({
  queryPrefetch: defineQueryPrefetch('products-id', ({ route }) => productQuery(route.params.id)),
  layout: 'catalog',`)
  })

  it('creates page metadata when the page has none', () => {
    const source = `<script setup lang="ts">
defineQueryPrefetch('products-id', ({ route }) => productQuery(route.params.id))
</script>`

    expect(transform(source)).toContain(`definePageMeta({
  queryPrefetch: defineQueryPrefetch('products-id', ({ route }) => productQuery(route.params.id)),
})`)
  })

  it.each([
    [
      'multiple macro calls',
      `defineQueryPrefetch('first', () => [])\ndefineQueryPrefetch('second', () => [])`,
      'Multiple defineQueryPrefetch calls',
    ],
    [
      'multiple page-meta calls',
      `defineQueryPrefetch('products-id', () => [])\ndefinePageMeta({ layout: 'default' })\ndefinePageMeta({ key: 'value' })`,
      'Multiple definePageMeta calls',
    ],
    [
      'non-object page metadata',
      `defineQueryPrefetch('products-id', () => [])\ndefinePageMeta(() => ({ layout: 'default' }))`,
      'definePageMeta must receive an object',
    ],
    [
      'page-meta spread',
      `defineQueryPrefetch('products-id', () => [])\ndefinePageMeta({ ...meta })`,
      'definePageMeta spreads are unsupported',
    ],
    [
      'duplicate page-meta definition',
      `defineQueryPrefetch('products-id', () => [])\ndefinePageMeta({ queryPrefetch: existing })`,
      'queryPrefetch is already configured',
    ],
    [
      'unsupported macro arguments',
      `defineQueryPrefetch('products-id')`,
      'defineQueryPrefetch must receive a route name and resolver',
    ],
  ])('rejects %s', (_label, statements, message) => {
    const source = `<script setup lang="ts">\n${statements}\n</script>`
    expect(() => transform(source)).toThrow(message)
  })

  it('detects shorthand and computed queryPrefetch metadata', () => {
    const shorthand = `<script setup>\ndefineQueryPrefetch('products-id', () => [])\ndefinePageMeta({ queryPrefetch })\n</script>`
    const computed = `<script setup>\ndefineQueryPrefetch('products-id', () => [])\ndefinePageMeta({ ['queryPrefetch']: existing })\n</script>`

    expect(() => transform(shorthand)).toThrow('queryPrefetch is already configured')
    expect(() => transform(computed)).toThrow('queryPrefetch is already configured')
  })
})
