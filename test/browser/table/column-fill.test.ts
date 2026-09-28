import { afterEach, describe, expect, it } from 'vitest'
import { h } from 'vue'

import TableRenderer from '#ui-tools/table/components/table/table-renderer.vue'

import { createAuditSchema } from '../../dom/fixtures/accounts'
import { mountLoaded } from '../../dom/harness'
import type { Harness } from '../../dom/harness'

let harness: Harness | undefined
afterEach(() => harness?.unmount())

describe('table column widths', () => {
  it('widens the data columns to fill the spare width instead of adding a filler', async () => {
    harness = await mountLoaded({
      render: () =>
        h('div', { style: { width: '1200px' } }, [h(TableRenderer, { height: '420px' })]),
      schema: createAuditSchema(),
    })
    const w = harness.wrapper
    await harness.until(() => w.findAll('tbody tr.nut-dl-row').length > 0, 4000)
    await harness.until(
      () => w.find('thead th[data-col="action"]').element.getBoundingClientRect().width > 160,
      4000,
    )

    const scroll = w.find('.nut-dl-table__scroll').element.getBoundingClientRect()
    const action = w.find('thead th[data-col="action"]').element.getBoundingClientRect()
    const actor = w.find('thead th[data-col="actor"]').element.getBoundingClientRect()
    const date = w.find('thead th[data-col="at"]').element.getBoundingClientRect()

    expect([
      w.find('.nut-dl-table__fill').exists(),
      Math.round(date.right - scroll.right),
      Math.round(action.width + actor.width + date.width - scroll.width),
    ]).toStrictEqual([false, 0, 0])
    expect(action.width).toBeGreaterThan(160)
  })
})
