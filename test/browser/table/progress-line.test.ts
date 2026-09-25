import { afterEach, describe, expect, it } from 'vitest'
import { h } from 'vue'

import TableRenderer from '#ui-tools/table/components/table/table-renderer.vue'

import { createAccountsSchema } from '../../dom/fixtures/accounts'
import { mountLoaded } from '../../dom/harness'
import type { Harness } from '../../dom/harness'
import { must } from '../../helpers/must'

let harness: Harness | undefined
afterEach(() => harness?.unmount())

describe('table loading line', () => {
  it('paints the loading line on the header edge while existing rows refresh', async () => {
    harness = await mountLoaded({
      render: () => h(TableRenderer, { height: '480px' }),
      schema: createAccountsSchema({ delay: 1500 }),
    })
    const w = harness.wrapper
    await harness.until(() => w.find('.nut-dl-table').attributes('data-loading') === 'false', 4000)

    const refresh = harness.internals.queryContent.refreshData()()
    await harness.until(() => {
      const current = must(w.find('.nut-dl-progress').element) as HTMLElement
      return current.isConnected && current.dataset.active === 'true'
    }, 4000)
    const line = must(w.find('.nut-dl-progress').element) as HTMLElement
    line.style.transition = 'none'

    const bar = must(line.firstElementChild) as HTMLElement
    const header = w.find('thead').element.getBoundingClientRect()
    const box = line.getBoundingClientRect()
    expect([
      box.height,
      Math.round(box.top - header.bottom),
      getComputedStyle(line).opacity,
    ]).toStrictEqual([2, -1, '1'])

    line.style.pointerEvents = 'auto'
    bar.style.pointerEvents = 'auto'
    bar.style.animation = 'none'
    bar.style.transform = 'translateX(0)'
    const barBox = bar.getBoundingClientRect()
    const x = Math.min(Math.max(barBox.left + barBox.width / 2, box.left + 1), box.right - 1)
    expect(document.elementFromPoint(x, box.top + 1)).toBe(bar)

    await refresh
    await harness.until(() => w.find('.nut-dl-progress').attributes('data-active') === 'false')
  })

  it('restarts the sweep from the start when a refresh is requested again', async () => {
    harness = await mountLoaded({
      render: () => h(TableRenderer, { height: '480px' }),
      schema: createAccountsSchema({ delay: 900 }),
    })
    const w = harness.wrapper
    await harness.until(() => w.find('.nut-dl-table').attributes('data-loading') === 'false', 4000)
    const sweepTime = () =>
      Number(w.find('.nut-dl-progress__bar').element.getAnimations()[0]?.currentTime ?? -1)

    void harness.internals.queryContent.refreshData()()
    await harness.until(() => w.find('.nut-dl-progress').attributes('data-active') === 'true')
    await harness.until(() => sweepTime() > 300, 4000)
    const before = sweepTime()

    void harness.internals.queryContent.refreshData()()
    await harness.flush()
    const after = sweepTime()

    expect([before > 300, after >= 0 && after < 120]).toStrictEqual([true, true])
  })
})
