import { QueryClient, queryOptions } from '@tanstack/vue-query'
import { describe, expect, expectTypeOf, it } from 'vitest'

import {
  defineQueryPrefetchPlan,
  executeQueryPrefetchPlan,
} from '../../src/runtime/query-prefetch/utils/plan'

describe('query prefetch plans', () => {
  it('preserves selected data across ordered stages', () => {
    const productQuery = queryOptions({
      queryKey: ['product', '42'] as const,
      queryFn: async () => ({ id: '42', categoryId: 'tools' }),
      select: (product) => ({ id: product.id }),
    })
    defineQueryPrefetchPlan()
      .stage({
        product: productQuery,
      })
      .stage(({ product }) => {
        expectTypeOf(product).toEqualTypeOf<{ id: string }>()
        return {
          category: queryOptions({
            queryKey: ['category', product.id] as const,
            queryFn: async () => product.id,
          }),
        }
      })
  })

  it('infers hand-written query functions without requiring queryOptions', () => {
    defineQueryPrefetchPlan()
      .stage({
        product: {
          queryKey: ['product', '42'],
          queryFn: async () => ({ id: '42' }),
        },
      })
      .stage(({ product }) => {
        expectTypeOf(product).toEqualTypeOf<{ id: string }>()
        return {}
      })
  })

  it('accepts query functions with TanStack query context parameters', () => {
    defineQueryPrefetchPlan().stage({
      product: queryOptions({
        queryKey: ['product', '42'],
        queryFn: async ({ queryKey }) => ({ id: String(queryKey[1]) }),
      }),
    })
  })

  it('executes stages in order and returns their accumulated context', async () => {
    const order: string[] = []
    const plan = defineQueryPrefetchPlan()
      .stage({
        product: queryOptions({
          queryKey: ['product'] as const,
          queryFn: async () => {
            order.push('product')
            return { id: '42' }
          },
        }),
      })
      .stage(({ product }) => {
        order.push(`category:${product.id}`)
        return {
          category: queryOptions({
            queryKey: ['category', product.id] as const,
            queryFn: async () => 'tools',
          }),
        }
      })

    await expect(
      executeQueryPrefetchPlan(plan, { queryClient: new QueryClient() }),
    ).resolves.toEqual({
      product: { id: '42' },
      category: 'tools',
    })
    expect(order).toEqual(['product', 'category:42'])
  })

  it('isolates a failed query and continues sibling work', async () => {
    const client = new QueryClient()
    const plan = defineQueryPrefetchPlan().stage({
      broken: queryOptions({
        queryKey: ['broken'] as const,
        retry: false,
        queryFn: async () => {
          throw new Error('expected prefetch failure')
        },
      }),
      healthy: queryOptions({
        queryKey: ['healthy'] as const,
        queryFn: async () => 'ready',
      }),
    })

    await expect(executeQueryPrefetchPlan(plan, { queryClient: client })).resolves.toEqual({
      broken: undefined,
      healthy: 'ready',
    })
  })
})
