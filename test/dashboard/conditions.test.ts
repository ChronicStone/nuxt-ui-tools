import { describe, expect, it } from 'vitest'

import { resolveDashboardCellStyle } from '#ui-tools/dashboard/utils/grid'
import { combineDashboardStates } from '#ui-tools/dashboard/utils/state'

describe('combineDashboardStates', () => {
  it('leaves disabled sources out, and is disabled only when every source is', () => {
    expect(combineDashboardStates(['disabled', 'loading'])).toBe('loading')
    expect(combineDashboardStates(['disabled', 'ready'])).toBe('ready')
    expect(combineDashboardStates(['disabled', 'idle'])).toBe('idle')
    expect(combineDashboardStates(['disabled', 'disabled'])).toBe('disabled')
    expect(combineDashboardStates([])).toBe('ready')
  })
})

describe('resolveDashboardCellStyle', () => {
  it('spans the columns a grid track run would, and grows by its span to close its row', () => {
    expect(resolveDashboardCellStyle({ columns: 12, fill: true, gap: '1px', span: 8 })).toBe(
      'flex: 8 1 calc((100% - 11 * 1px) / 12 * 8 + 7 * 1px - 0.02px); min-width: 0',
    )
    expect(resolveDashboardCellStyle({ columns: 12, fill: false, gap: '1rem', span: 4 })).toContain(
      'flex: 0 1 ',
    )
  })

  it('takes the full row without a span, or with one wider than the grid', () => {
    const full = 'flex: 1 1 100%; min-width: 0'
    expect(resolveDashboardCellStyle({ columns: 12, fill: true, gap: '1px', span: null })).toBe(
      full,
    )
    expect(resolveDashboardCellStyle({ columns: 5, fill: true, gap: '1px', span: 8 })).toBe(full)
  })
})
