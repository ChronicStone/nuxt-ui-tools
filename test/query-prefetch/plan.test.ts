import { QueryClient, queryOptions } from '@tanstack/vue-query'
import { describe, expect, expectTypeOf, it } from 'vitest'

import {
  defineQueryPrefetchPlan,
  executeQueryPrefetchPlan,
} from '../../src/runtime/query-prefetch/utils/plan'

describe('query prefetch plans', () => {
  it('preserves selected data across ordered stages', () => {
    const productQuery = queryOptions({
      queryFn: () => ({ categoryId: 'tools', id: '42' }),
      queryKey: ['product', '42'] as const,
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
            queryFn: () => product.id,
            queryKey: ['category', product.id] as const,
          }),
        }
      })
  })

  it('infers hand-written query functions without requiring queryOptions', () => {
    defineQueryPrefetchPlan()
      .stage({
        product: {
          queryFn: () => ({ id: '42' }),
          queryKey: ['product', '42'],
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
        queryFn: ({ queryKey }) => ({ id: String(queryKey[1]) }),
        queryKey: ['product', '42'],
      }),
    })
  })

  it('executes stages in order and returns their accumulated context', async () => {
    const order: string[] = []
    const plan = defineQueryPrefetchPlan()
      .stage({
        product: queryOptions({
          queryFn: () => {
            order.push('product')
            return { id: '42' }
          },
          queryKey: ['product'] as const,
        }),
      })
      .stage(({ product }) => {
        order.push(`category:${product.id}`)
        return {
          category: queryOptions({
            queryFn: () => 'tools',
            queryKey: ['category', product.id] as const,
          }),
        }
      })

    await expect(
      executeQueryPrefetchPlan(plan, { queryClient: new QueryClient() }),
    ).resolves.toStrictEqual({
      category: 'tools',
      product: { id: '42' },
    })
    expect(order).toStrictEqual(['product', 'category:42'])
  })

  it('isolates a failed query and continues sibling work', async () => {
    const client = new QueryClient()
    const plan = defineQueryPrefetchPlan().stage({
      broken: queryOptions({
        queryFn: () => {
          throw new Error('expected prefetch failure')
        },
        queryKey: ['broken'] as const,
        retry: false,
      }),
      healthy: queryOptions({
        queryFn: () => 'ready',
        queryKey: ['healthy'] as const,
      }),
    })

    await expect(executeQueryPrefetchPlan(plan, { queryClient: client })).resolves.toStrictEqual({
      broken: undefined,
      healthy: 'ready',
    })
  })
})
