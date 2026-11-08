import { afterAll, afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { h } from 'vue'

import GridRenderer from '#ui-tools/table/components/grid/grid-renderer.vue'

import { asAccount, createAccounts, createAccountsSchema } from '../../dom/fixtures/accounts'
import { mountLoaded } from '../../dom/harness'
import type { Harness } from '../../dom/harness'
import { must } from '../../helpers/must'

let harness: Harness | undefined
afterEach(() => harness?.unmount())
afterAll(async () => {
  await page.viewport(1920, 1080)
})

/** A card like an app draws it: its own box, a body, and a footer pinned to the bottom. */
function customCard(id: string) {
  return h('article', { class: 'custom-card flex h-full flex-col border', style: { gap: '0' } }, [
    h('header', { class: 'custom-head px-4 pt-4 pb-3', style: { height: '56px' } }, id),
    h('div', { class: 'custom-body px-4 pb-3', style: { height: '48px' } }, 'body'),
    h('footer', { class: 'custom-foot mt-auto border-t px-4 py-2.5' }, 'footer'),
  ])
}

async function mountCards(options: { selection: boolean; custom: boolean }) {
  await page.viewport(390, 900)
  const schema = createAccountsSchema({
    rows: createAccounts(4),
    selection: { mode: options.selection },
  })
  const grid = must(schema.grid)
  grid.mode = 'flow'
  grid.gridSize = 1
  if (options.custom) {
    grid.renderItem = ({ row }) => customCard(asAccount(row).id)
  }
  harness = await mountLoaded({
    breakpoint: 'sm',
    query: { l: 'grid' },
    render: () => h('div', { style: { width: '390px' } }, [h(GridRenderer)]),
    schema,
  })
  await harness.until(() => must(harness).wrapper.findAll('.nut-dl-grid__item').length === 4)
  await harness.flush()
}

function items() {
  return [...document.querySelectorAll<HTMLElement>('.nut-dl-grid__item')]
}

function heights() {
  return items().map((item) => item.getBoundingClientRect().height)
}

describe.each([
  { custom: false, name: 'the default card' },
  { custom: true, name: 'a custom card with a pinned footer' },
])('grid card selection at 390px with $name', ({ custom }) => {
  it('draws the checkbox over the card corner, out of the card flow, as a 44px target', async () => {
    await mountCards({ custom, selection: true })
    for (const item of items()) {
      const shell = must(item.querySelector<HTMLElement>('.nut-dl-grid__select'))
      const box = shell.getBoundingClientRect()
      const card = item.getBoundingClientRect()
      expect(getComputedStyle(shell).position).toBe('absolute')
      expect(box.width).toBeGreaterThanOrEqual(44)
      expect(box.height).toBeGreaterThanOrEqual(44)
      expect(card.right - box.right).toBeLessThanOrEqual(8)
      expect(box.top - card.top).toBeLessThanOrEqual(8)
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
      expect(hit && shell.contains(hit)).toBe(true)
    }
  })

  it('keeps the natural height of the card, with no band before the footer', async () => {
    await mountCards({ custom, selection: false })
    const natural = heights()
    expect(document.querySelector('.nut-dl-grid__select')).toBeNull()
    harness?.unmount()

    await mountCards({ custom, selection: true })
    expect(heights()).toStrictEqual(natural)
    if (custom) {
      const item = must(items()[0])
      const body = must(item.querySelector('.custom-body')).getBoundingClientRect()
      const foot = must(item.querySelector('.custom-foot')).getBoundingClientRect()
      expect(foot.top - body.bottom).toBe(0)
    }
  })

  it('selects the card from its checkbox', async () => {
    await mountCards({ custom, selection: true })
    const control = must(
      items()[1]?.querySelector<HTMLElement>('.nut-dl-grid__select .nut-dl-select'),
    )
    control.click()
    await must(harness).flush()
    expect(must(harness).internals.selection.selectedKeys.value).toStrictEqual(['acc-2'])
  })
})
