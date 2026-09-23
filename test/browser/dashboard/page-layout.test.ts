import { afterEach, describe, expect, it } from 'vitest'
import { h } from 'vue'

import { defineDashboardSchema } from '#ui-tools/dashboard'
import DashboardPage from '#ui-tools/dashboard/components/dashboard-page.vue'

import { mountDashboard } from '../../dom/dashboard/harness'
import { must } from '../../helpers/must'
import { clearLayouts, settle } from './layout'

let cleanup: (() => void) | undefined

afterEach(() => {
  cleanup?.()
  cleanup = undefined
  clearLayouts()
})

const schema = defineDashboardSchema({
  key: 'page-layout',
  params: (p) => ({ year: p.enum([2025, 2026], { defaultValue: 2026, label: 'Year' }) }),
})

async function mountPage() {
  const harness = await mountDashboard({
    render: (api) =>
      h('div', { style: 'height: 600px; width: 1000px' }, [
        h(
          DashboardPage,
          { dashboard: api, title: 'Board' },
          { default: () => h('div', { 'data-content': '', style: 'height: 2400px' }) },
        ),
      ]),
    schema,
  })
  cleanup = () => harness.wrapper.unmount()
  const page = must(document.querySelector<HTMLElement>('[data-dashboard-page]'))
  const toolbar = must(page.querySelector<HTMLElement>('header + div + div'))
  return { page, toolbar }
}

/** Waits for the intersection observer to report, a frame or two after a scroll. */
async function scrollTo(page: HTMLElement, top: number) {
  page.scrollTop = top
  await settle()
  await new Promise((resolve) => setTimeout(resolve, 50))
  await settle()
}

describe('dashboard page layout', () => {
  it('scrolls on its own and pins the filter band once the header scrolls away', async () => {
    const { page, toolbar } = await mountPage()

    expect(page.getBoundingClientRect().height).toBe(600)
    expect(page.scrollHeight).toBeGreaterThan(2400)
    expect(toolbar.hasAttribute('data-stuck')).toBe(false)
    expect(toolbar.querySelector('[data-dashboard-filter="year"]')).not.toBeNull()

    await scrollTo(page, 800)
    expect(toolbar.getBoundingClientRect().top).toBeCloseTo(page.getBoundingClientRect().top, 0)
    expect(toolbar.hasAttribute('data-stuck')).toBe(true)

    await scrollTo(page, 0)
    expect(toolbar.hasAttribute('data-stuck')).toBe(false)
    const header = must(page.querySelector('header'))
    expect(toolbar.getBoundingClientRect().top).toBeCloseTo(header.getBoundingClientRect().bottom, 0)
  })
})
