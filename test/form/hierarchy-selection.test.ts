import { describe, expect, it } from 'vitest'

import { resolveHierarchySelection } from '../../src/runtime/form/fields/hierarchy/utils'
import { normalizeOptionItems } from '../../src/runtime/form/utils/options'

const items = normalizeOptionItems([
  {
    value: 'products',
    label: 'Products',
    children: [
      { value: 'auctions', label: 'Auctions' },
      { value: 'direct-sales', label: 'Direct sales' },
    ],
  },
])

describe('hierarchy selection', () => {
  it('does not bubble a filtered child into a parent with hidden unselected children', () => {
    expect(
      resolveHierarchySelection({
        next: ['direct-sales', 'products'],
        intent: 'direct-sales',
        items,
        propagate: true,
        bubble: true,
      }),
    ).toEqual(['direct-sales'])
  })

  it('propagates a parent selection across hidden descendants and deduplicates output', () => {
    expect(
      resolveHierarchySelection({
        next: ['products', 'direct-sales', 'direct-sales'],
        intent: 'products',
        items,
        propagate: true,
        bubble: true,
      }),
    ).toEqual(['products', 'direct-sales', 'auctions'])
  })
})
