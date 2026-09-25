import { afterEach, describe, expect, it } from 'vitest'
import { h } from 'vue'

import TableRenderer from '#ui-tools/table/components/table/table-renderer.vue'

import { createAuditSchema } from '../../dom/fixtures/accounts'
import { mountLoaded } from '../../dom/harness'
import type { Harness } from '../../dom/harness'

let harness: Harness | undefined
afterEach(() => harness?.unmount())

describe('table column widths', () => {
  it('keeps declared widths and hands spare width to a trailing filler', async () => {
    harness = await mountLoaded({
      render: () =>
        h('div', { style: { width: '1200px' } }, [h(TableRenderer, { height: '420px' })]),
      schema: createAuditSchema(),
    })
    const w = harness.wrapper
    await harness.until(() => w.findAll('tbody tr.nut-dl-row').length > 0, 4000)
    await harness.until(() => w.find('thead .nut-dl-table__fill').exists(), 4000)

    const scroll = w.find('.nut-dl-table__scroll').element.getBoundingClientRect()
    const action = w.find('thead th[data-col="action"]').element.getBoundingClientRect()
    const date = w.find('thead th[data-col="at"]').element.getBoundingClientRect()
    const fill = w.find('thead .nut-dl-table__fill').element.getBoundingClientRect()
    const row = w.find('tbody tr.nut-dl-row')
    const cells = row.findAll('td')

    expect([
      Math.round(action.width),
      Math.round(fill.right - scroll.right),
      Math.round(fill.left - date.right),
      cells.at(-1)?.classes('nut-dl-table__fill'),
    ]).toStrictEqual([160, 0, 0, true])
    expect(fill.width).toBeGreaterThan(600)
  })
})
