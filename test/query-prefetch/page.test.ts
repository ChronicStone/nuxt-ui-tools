import { QueryClient, queryOptions } from '@tanstack/vue-query'
import { describe, expect, it } from 'vitest'

import type { QueryPrefetchRuntimeRoute } from '../../src/runtime/query-prefetch/types/page'
import {
  defineQueryPrefetch,
  executeQueryPrefetch,
} from '../../src/runtime/query-prefetch/utils/page'

const route: QueryPrefetchRuntimeRoute = {
  fullPath: '/products/42',
  hash: '',
  name: 'products-id',
  params: { id: '42' },
  path: '/products/42',
  query: {},
}

describe('page query prefetch', () => {
  it('prefetches a simple query and applies select output', async () => {
    const definition = defineQueryPrefetch('products-id', () =>
      queryOptions({
        queryKey: ['product', '42'] as const,
        queryFn: async () => ({ id: '42', title: 'Drill' }),
        select: (product) => product.title,
      }),
    )

    await expect(
      executeQueryPrefetch(definition, { queryClient: new QueryClient(), route }),
    ).resolves.toEqual(['Drill'])
  })

  it('contains resolver and query failures', async () => {
    const broken = defineQueryPrefetch('products-id', () => {
      throw new Error('expected resolver failure')
    })

    await expect(
      executeQueryPrefetch(broken, { queryClient: new QueryClient(), route }),
    ).resolves.toEqual([])
  })
})
