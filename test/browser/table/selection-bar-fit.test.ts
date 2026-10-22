import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { h } from 'vue'

import DataListContent from '#ui-tools/table/components/data-list/data-list-content.vue'
import DataListSelectionActions from '#ui-tools/table/components/data-list/data-list-selection-actions.vue'

import { bulkActionCalls, createAccounts, createAccountsSchema } from '../../dom/fixtures/accounts'
import type { AccountsSchemaOptions } from '../../dom/fixtures/accounts'
import { mountLoaded } from '../../dom/harness'
import type { Harness } from '../../dom/harness'
import type { BreakpointKey } from '../../dom/nuxt-state'
import { must } from '../../helpers/must'

let harness: Harness | undefined
afterEach(() => harness?.unmount())

const menuItems = document.createElement('style')
menuItems.textContent =
  '[data-ui="UDropdownMenu"] :is([data-ui-content], [data-ui-items]) { display: none }'
beforeAll(() => {
  document.head.append(menuItems)
})
afterAll(async () => {
  menuItems.remove()
  await page.viewport(1920, 1080)
})

const LONG_LABELS = ['Nouvelle action à mener', 'Exporter en Excel', 'Changer les rubriques']

async function mountBar(
  width: number,
  options: { breakpoint?: BreakpointKey; schema?: AccountsSchemaOptions } = {},
) {
  await page.viewport(options.breakpoint === 'sm' ? width : Math.max(width, 1024), 900)
  harness = await mountLoaded({
    breakpoint: options.breakpoint,
    render: () =>
      h('div', { style: { position: 'relative', width: `${width}px`, height: '160px' } }, [
        h(DataListSelectionActions),
      ]),
    schema: createAccountsSchema(options.schema),
  })
  harness.internals.selection.selectRows({ rowIds: ['acc-1', 'acc-2'] })
  await harness.until(() => Boolean(document.querySelector('.nut-dl-selbar__bar')), 4000)
  await harness.flush()

  return document.querySelector<HTMLElement>('.nut-dl-selbar__actions')
}

function box(selector: string) {
  return must(document.querySelector<HTMLElement>(selector), selector).getBoundingClientRect()
}

function inlineActions() {
  return [...document.querySelectorAll<HTMLElement>('.nut-dl-selbar__action')]
}

function expectInside(selector: string, container: string) {
  const outer = box(container)
  const part = box(selector)
  expect(part.left).toBeGreaterThanOrEqual(outer.left)
  expect(part.right).toBeLessThanOrEqual(outer.right)
  expect(part.top).toBeGreaterThanOrEqual(outer.top)
  expect(part.bottom).toBeLessThanOrEqual(outer.bottom)
}

describe('selection bar on desktop', () => {
  it('moves actions that do not fit into the overflow menu instead of clipping them', async () => {
    const strip = await mountBar(560)

    expect(strip && strip.scrollWidth <= strip.clientWidth).toBe(true)
    expect(inlineActions().length).toBeLessThan(3)
    expect(document.querySelector('.nut-dl-selbar__more')).not.toBeNull()
  })

  it('keeps three inline actions when the bar has room', async () => {
    const strip = await mountBar(1200)

    expect(strip && strip.scrollWidth <= strip.clientWidth).toBe(true)
    expect(inlineActions()).toHaveLength(3)
  })

  it.each([
    { breakpoint: 'md' as const, width: 768 },
    { breakpoint: 'xl' as const, width: 1440 },
  ])('keeps the one-row bar at $width px', async ({ breakpoint, width }) => {
    const strip = must(await mountBar(width, { breakpoint, schema: { actionLabels: LONG_LABELS } }))

    expect(document.querySelector('.nut-dl-selbar__bar--compact')).toBeNull()
    expect(document.querySelector('.nut-dl-selbar__trigger')).toBeNull()
    expect(strip.scrollWidth).toBeLessThanOrEqual(strip.clientWidth + 1)
    expect(inlineActions().length).toBeGreaterThan(0)
    expect(box('.nut-dl-selbar__bar').height).toBe(44)
    for (const part of ['.nut-dl-selbar__scope', '.nut-dl-selbar__dismiss'])
      expectInside(part, '.nut-dl-selbar__bar')
  })
})

describe('selection bar on a phone', () => {
  it.each([360, 390, 430])(
    'keeps the clear button, the count and « Actions » whole at %i px',
    async (width) => {
      await mountBar(width, { breakpoint: 'sm', schema: { actionLabels: LONG_LABELS } })

      expect(box('.nut-dl-selbar__bar--compact').width).toBe(width - 32)
      expect(inlineActions()).toHaveLength(0)
      for (const part of [
        '.nut-dl-selbar__dismiss',
        '.nut-dl-selbar__count',
        '.nut-dl-selbar__trigger',
      ])
        expectInside(part, '.nut-dl-selbar__bar--compact')
      for (const control of ['.nut-dl-selbar__dismiss', '.nut-dl-selbar__trigger'])
        expect(box(control).height).toBeGreaterThanOrEqual(44)
      expect(box('.nut-dl-selbar__dismiss').width).toBeGreaterThanOrEqual(44)
      expect(box('.nut-dl-selbar__dismiss').right).toBeLessThanOrEqual(
        box('.nut-dl-selbar__count').left,
      )
      expect(box('.nut-dl-selbar__count').right).toBeLessThanOrEqual(
        box('.nut-dl-selbar__trigger').left,
      )
      const trigger = must(document.querySelector<HTMLElement>('.nut-dl-selbar__trigger'))
      expect(trigger.scrollWidth).toBeLessThanOrEqual(trigger.clientWidth)
    },
  )

  it('keeps the bar height when the count switches to all results', async () => {
    await mountBar(360, { breakpoint: 'sm' })
    const height = box('.nut-dl-selbar__bar--compact').height
    must(harness).internals.selection.setBulkScope('all')
    await must(harness).flush()

    expect(must(document.querySelector('.nut-dl-selbar__count')).textContent).toContain('60')
    expect(box('.nut-dl-selbar__bar--compact').height).toBe(height)
    expectInside('.nut-dl-selbar__count', '.nut-dl-selbar__bar--compact')
  })

  it('runs an action from the sheet with the desktop handler', async () => {
    bulkActionCalls.splice(0)
    await mountBar(390, { breakpoint: 'sm', schema: { actionDetails: true } })

    must(document.querySelector<HTMLElement>('[data-ui="UDrawer"] [data-ui-trigger]')).click()
    await must(harness).flush()
    const rows = [...document.querySelectorAll<HTMLElement>('.nut-dl-selsheet__action')]
    expect(rows).toHaveLength(5)
    for (const row of rows) expect(row.getBoundingClientRect().height).toBeGreaterThanOrEqual(44)
    expect(must(rows.at(-1)).textContent?.trim()).toBe('Supprimer')

    must(rows[0]).click()
    await must(harness).flush()
    expect(bulkActionCalls).toStrictEqual(['export'])
    expect(document.querySelector('.nut-dl-selsheet__action')).toBeNull()
  })

  it('lets the last card scroll above the bar', async () => {
    await page.viewport(390, 900)
    harness = await mountLoaded({
      breakpoint: 'sm',
      render: () =>
        h(
          'div',
          { style: { display: 'flex', height: '420px', position: 'relative', width: '390px' } },
          [
            h(DataListContent, { class: 'min-h-0 flex-1', fit: 'fill' }),
            h(DataListSelectionActions),
          ],
        ),
      schema: createAccountsSchema({ rows: createAccounts(4) }),
    })
    harness.internals.controls.setTableLayout('grid')
    harness.internals.selection.selectRows({ rowIds: ['acc-1', 'acc-2'] })
    await harness.until(() => Boolean(document.querySelector('.nut-dl-overlay-inset')), 4000)
    const viewport = must(document.querySelector<HTMLElement>('.nut-dl-grid__viewport'))
    viewport.scrollTop = viewport.scrollHeight
    await harness.flush()

    const cards = [...document.querySelectorAll<HTMLElement>('.nut-dl-grid__item')]
    const last = must(cards.at(-1)).getBoundingClientRect()
    expect(last.bottom).toBeLessThanOrEqual(box('.nut-dl-selbar__bar--compact').top)
    const hit = document.elementFromPoint(last.left + 20, last.bottom - 10)
    expect(hit?.closest('.nut-dl-grid__item')).toBe(cards.at(-1))

    harness.internals.selection.clearSelection()
    await harness.until(() => !document.querySelector('.nut-dl-overlay-inset'), 4000)
  })
})
