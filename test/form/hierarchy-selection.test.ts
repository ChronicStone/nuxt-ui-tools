import { describe, expect, it } from 'vitest'

import { resolveHierarchySelection } from '../../src/runtime/form/fields/hierarchy/utils'
import { normalizeOptionItems } from '../../src/runtime/form/utils/options'

const items = normalizeOptionItems([
  {
    children: [
      { label: 'Auctions', value: 'auctions' },
      { label: 'Direct sales', value: 'direct-sales' },
    ],
    label: 'Products',
    value: 'products',
  },
])

describe('hierarchy selection', () => {
  it('does not bubble a filtered child into a parent with hidden unselected children', () => {
    expect(
      resolveHierarchySelection({
        bubble: true,
        intent: 'direct-sales',
        items,
        next: ['direct-sales', 'products'],
        propagate: true,
      }),
    ).toStrictEqual(['direct-sales'])
  })

  it('propagates a parent selection across hidden descendants and deduplicates output', () => {
    expect(
      resolveHierarchySelection({
        bubble: true,
        intent: 'products',
        items,
        next: ['products', 'direct-sales', 'direct-sales'],
        propagate: true,
      }),
    ).toStrictEqual(['products', 'direct-sales', 'auctions'])
  })
})
