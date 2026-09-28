import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { h } from 'vue'

import TableSkeletonCell from '#ui-tools/table/components/table/table-skeleton-cell'

describe('TableSkeletonCell', () => {
  it('aligns a number skeleton with its column instead of always to the right', () => {
    const start = mount(() => h(TableSkeletonCell, { seed: 1, skeleton: 'number' }))
    const end = mount(() => h(TableSkeletonCell, { align: 'right', seed: 1, skeleton: 'number' }))

    expect(start.get('[data-skeleton="number"]').classes()).not.toContain('justify-end')
    expect(end.get('[data-skeleton="number"]').classes()).toContain('justify-end')
  })
})
