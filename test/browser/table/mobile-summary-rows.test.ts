import { config } from '@vue/test-utils'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'
import { h, nextTick } from 'vue'

import DataListContent from '#ui-tools/table/components/data-list/data-list-content.vue'

import { createAccounts, createAccountsSchema } from '../../dom/fixtures/accounts'
import type { AccountsSchemaOptions } from '../../dom/fixtures/accounts'
import { mountLoaded } from '../../dom/harness'
import type { Harness } from '../../dom/harness'
import { must } from '../../helpers/must'

let harness: Harness | undefined
afterEach(() => harness?.unmount())

const PHONE_WIDTH = 375
const DESKTOP_VIEWPORT = { height: 1080, width: 1920 }
const LONG_NAME = 'Établissement de formation professionnelle continue du Grand Est'

const defaultStubs = config.global.stubs
beforeAll(async () => {
  /* The first list to mount syncs the breakpoint from the window's real media queries, which would
     turn the mobile breakpoint the harness sets into the 1920px window's. A phone-sized viewport
     keeps the two in agreement. The test library's stubbed transitions give way to Vue's own,
     which a swap between the two views runs through. */
  config.global.stubs = { Teleport: true }
  await page.viewport(PHONE_WIDTH, 812)
})
afterAll(async () => {
  config.global.stubs = defaultStubs
  await page.viewport(DESKTOP_VIEWPORT.width, DESKTOP_VIEWPORT.height)
})

/** The list in a column as wide as a phone, with the fixed height a full-screen page gives it. */
async function mountPhone(options: AccountsSchemaOptions & { width?: number } = {}) {
  const { width = PHONE_WIDTH, ...schemaOptions } = options
  const mounted = await mountLoaded({
    breakpoint: 'sm',
    render: () =>
      h(
        'div',
        {
          style: { display: 'flex', flexDirection: 'column', height: '640px', width: `${width}px` },
        },
        [h(DataListContent, { class: 'min-h-0 flex-1', fit: 'fill' })],
      ),
    schema: createAccountsSchema({ summary: true, ...schemaOptions }),
  })
  harness = mounted
  await mounted.until(() => mounted.wrapper.find('.nut-dl-summary__row').exists(), 4000)
  return mounted
}

function element(selector: string) {
  return must(harness?.wrapper.find(selector).element, selector)
}

function box(selector: string) {
  const { height, right, width } = element(selector).getBoundingClientRect()
  return { height: Math.round(height), right, width: Math.round(width) }
}

describe('summary rows on a phone', () => {
  it('lays a row out as a 32px tile, a 13.5px title and a 44px actions button', async () => {
    await mountPhone()

    expect(box('.nut-dl-summary__row').height).toBe(64)
    expect(box('.nut-dl-summary__leading')).toMatchObject({ height: 32, width: 32 })
    const title = getComputedStyle(element('.nut-dl-summary__title'))
    expect([title.fontSize, title.fontWeight]).toStrictEqual(['13.5px', '600'])
    const actions = box('.nut-dl-summary__row .nut-dl-rowbtn')
    expect([actions.width >= 44, actions.height >= 44]).toStrictEqual([true, true])
  })

  it('gives every selection checkbox a 44px tap area', async () => {
    await mountPhone()

    for (const selector of [
      '.nut-dl-summary__header .nut-dl-select',
      '.nut-dl-summary__row .nut-dl-select',
    ]) {
      const area = box(selector)
      expect([selector, area.width >= 44, area.height >= 44]).toStrictEqual([selector, true, true])
    }
  })

  it('truncates a long title and keeps the actions button inside the row', async () => {
    await mountPhone({
      rows: createAccounts(1).map((row) => ({ ...row, name: LONG_NAME })),
      width: 240,
    })

    const title = element('.nut-dl-summary__title')
    expect(title.scrollWidth).toBeGreaterThan(title.clientWidth)
    expect(getComputedStyle(title).textOverflow).toBe('ellipsis')
    expect(box('.nut-dl-summary__row .nut-dl-rowbtn').right).toBeLessThanOrEqual(
      box('.nut-dl-summary__row').right,
    )
  })

  it.each([320, PHONE_WIDTH])('fits a %ipx screen without scrolling sideways', async (width) => {
    await mountPhone({ width })

    const viewport = element('.nut-dl-summary__viewport')
    expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.clientWidth)
  })
})

describe('switching between summary rows and the table', () => {
  it('leaves one view before the other comes in, and ends on a fully visible one', async () => {
    const mounted = await mountPhone()
    const content = element('[data-data-list-viewport]')
    const exists = (selector: string) => mounted.wrapper.find(selector).exists()
    let overlapped = false
    const observer = new MutationObserver(() => {
      if (content.querySelector('.nut-dl-summary') && content.querySelector('.nut-dl-table'))
        overlapped = true
    })
    observer.observe(content, { childList: true, subtree: true })

    async function swapTo(active: boolean, leaving: string, entering: string) {
      mounted.internals.rowSummary.setActive(active)
      await nextTick()
      expect([exists(leaving), exists(entering)]).toStrictEqual([true, false])
      await vi.waitFor(
        () => {
          const view = element(entering)
          expect(getComputedStyle(view).opacity).toBe('1')
          expect(view.className).not.toContain('-enter-')
          expect(exists(leaving)).toBeFalsy()
        },
        { timeout: 4000 },
      )
    }

    await swapTo(false, '.nut-dl-summary', '.nut-dl-table')
    await swapTo(true, '.nut-dl-table', '.nut-dl-summary')
    observer.disconnect()

    expect(overlapped).toBeFalsy()
  })
})
