import { afterEach, describe, expect, it } from 'vitest'
import { h } from 'vue'

import TableRenderer from '#ui-tools/table/components/table/table-renderer.vue'

import { createAccounts, createAccountsSchema } from '../../dom/fixtures/accounts'
import { mountLoaded } from '../../dom/harness'
import type { Harness } from '../../dom/harness'

let harness: Harness | undefined
afterEach(() => harness?.unmount())

function edges(element: Element | undefined) {
  const box = element?.getBoundingClientRect()
  return box ? [Math.round(box.left), Math.round(box.right)] : []
}

describe('table summary row', () => {
  it('lines totals and the label up with the cells above them', async () => {
    harness = await mountLoaded({
      render: () =>
        h('div', { style: { width: '1200px' } }, [h(TableRenderer, { height: '420px' })]),
      schema: createAccountsSchema({ rows: createAccounts(60) }),
    })
    const w = harness.wrapper
    await harness.until(
      () => w.find('tfoot td[data-col="contracts"] .nut-dl-tf__value').exists(),
      4000,
    )

    const cell = w.find('tbody tr.nut-dl-row td[data-col="contracts"] .nut-dl-td__inner')
    const total = w.find('tfoot td[data-col="contracts"] .nut-dl-tf__value')
    const name = w.find('tbody tr.nut-dl-row td[data-col="name"] .nut-dl-td__inner')
    const label = w.find('tfoot td[data-col="name"] .nut-dl-tf__label')

    expect([edges(total.element)[1], edges(label.element)[0]]).toStrictEqual([
      edges(cell.element)[1],
      edges(name.element)[0],
    ])
  })
})
