import { afterEach, describe, expect, it } from 'vitest'
import { h } from 'vue'

import DataListSelectionActions from '#ui-tools/table/components/data-list/data-list-selection-actions.vue'

import { createAccountsSchema } from '../../dom/fixtures/accounts'
import { mountLoaded } from '../../dom/harness'
import type { Harness } from '../../dom/harness'

let harness: Harness | undefined
afterEach(() => harness?.unmount())

async function mountBar(width: number) {
  harness = await mountLoaded({
    render: () =>
      h('div', { style: { position: 'relative', width: `${width}px`, height: '160px' } }, [
        h(DataListSelectionActions),
      ]),
    schema: createAccountsSchema(),
  })
  harness.internals.selection.selectRows({ rowIds: ['acc-1', 'acc-2'] })
  await harness.until(() => Boolean(document.querySelector('.nut-dl-selbar__actions')), 4000)
  await harness.flush()

  return document.querySelector<HTMLElement>('.nut-dl-selbar__actions')
}

describe('selection bar fit', () => {
  it('moves actions that do not fit into the overflow menu instead of clipping them', async () => {
    const strip = await mountBar(560)
    const inline = document.querySelectorAll('.nut-dl-selbar__action').length

    expect(strip && strip.scrollWidth <= strip.clientWidth).toBe(true)
    expect(inline).toBeLessThan(3)
    expect(document.querySelector('.nut-dl-selbar__more')).not.toBeNull()
  })

  it('keeps three inline actions when the bar has room', async () => {
    const strip = await mountBar(1200)

    expect(strip && strip.scrollWidth <= strip.clientWidth).toBe(true)
    expect(document.querySelectorAll('.nut-dl-selbar__action').length).toBe(3)
  })
})
