import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { h, nextTick, reactive } from 'vue'

import DashboardViewTabs from '#ui-tools/dashboard/components/dashboard-view-tabs.vue'
import type { DashboardViewController } from '#ui-tools/dashboard/types'

import { settle } from './layout'

const mounted: { unmount: () => void }[] = []

afterEach(() => {
  for (const wrapper of mounted.splice(0)) wrapper.unmount()
  document.getElementById('active-bold')?.remove()
})

/** What an app's `ui.viewTabs.tab` does: the stylesheet only holds the classes the library ships. */
function turnActiveBold() {
  const style = document.createElement('style')
  style.id = 'active-bold'
  style.textContent = '[data-dashboard-view-tabs] [data-active] { font-weight: 700 }'
  document.head.append(style)
}

function mountTabs() {
  const view = reactive({
    current: 'consumption',
    items: [
      { label: 'Consumption', value: 'consumption' },
      { label: 'Candidates & certifications', value: 'candidates' },
    ],
  })
  // SAFETY: the tabs read only `current` and `items` of the controller, which `view` provides.
  const controller = view as unknown as DashboardViewController<string>
  const wrapper = mount(() => h(DashboardViewTabs, { dashboard: { view: controller } }), {
    attachTo: document.body,
  })
  mounted.push(wrapper)
  return { view, wrapper }
}

function lefts() {
  return [...document.querySelectorAll<HTMLElement>('[data-dashboard-view-tabs] button')].map(
    (tab) => tab.getBoundingClientRect().left,
  )
}

describe('dashboard view tabs', () => {
  it('keeps every tab in place when an app turns the active label bold', async () => {
    turnActiveBold()
    const { view } = mountTabs()
    await settle()
    const first = lefts()
    view.current = 'candidates'
    await nextTick()
    await settle()
    expect(lefts()).toEqual(first)
    view.current = 'consumption'
    await nextTick()
    await settle()
    expect(lefts()).toEqual(first)
  })

  it('keeps the label as the tab text and name', async () => {
    turnActiveBold()
    mountTabs()
    await settle()
    const [tab] = document.querySelectorAll<HTMLElement>('[data-dashboard-view-tabs] button')
    expect(tab?.textContent?.trim()).toBe('Consumption')
    expect(tab?.innerText.trim()).toBe('Consumption')
  })
})
