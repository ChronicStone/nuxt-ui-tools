import { afterEach, describe, expect, it } from 'vitest'
import { h } from 'vue'

import TableRenderer from '#ui-tools/table/components/table/table-renderer.vue'

import { createWideSchema } from '../../dom/fixtures/accounts'
import { mountLoaded } from '../../dom/harness'
import type { Harness } from '../../dom/harness'

let harness: Harness | undefined
afterEach(() => harness?.unmount())

function misaligned(scroller: Element) {
  return [...scroller.querySelectorAll<HTMLElement>('thead th[data-col]')].flatMap((th) => {
    const head = th.getBoundingClientRect()
    return ['tbody tr.nut-dl-row', 'tfoot tr'].flatMap((row) => {
      const cell = scroller.querySelector(`${row} td[data-col="${th.dataset.col}"]`)
      const box = cell?.getBoundingClientRect()
      return box && (Math.abs(box.left - head.left) > 0.5 || Math.abs(box.width - head.width) > 0.5)
        ? [`${row} ${th.dataset.col}`]
        : []
    })
  })
}

describe('table column virtualization', () => {
  it('mounts only the columns in view and keeps them aligned while scrolling sideways', async () => {
    harness = await mountLoaded({
      render: () =>
        h('div', { style: { width: '900px' } }, [h(TableRenderer, { height: '420px' })]),
      schema: createWideSchema(),
    })
    const w = harness.wrapper
    await harness.until(() => w.find('tfoot td[data-col="m1"] .nut-dl-tf__value').exists(), 4000)
    const scroller = w.find('.nut-dl-table__scroll').element
    const headers = () => w.findAll('thead th[data-col]').map((th) => th.attributes('data-col'))

    expect([headers().length < 21, headers().includes('m20'), misaligned(scroller)]).toStrictEqual([
      true,
      false,
      [],
    ])

    scroller.scrollLeft = scroller.scrollWidth
    await harness.until(() => headers().includes('m20'), 4000)
    const pinned = w.find('thead th[data-col="name"]').element.getBoundingClientRect()

    expect([
      headers().includes('m1'),
      Math.round(pinned.left - scroller.getBoundingClientRect().left),
      misaligned(scroller),
    ]).toStrictEqual([false, 0, []])
  })
})
