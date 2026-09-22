import { describe, expect, it } from 'vitest'
import { h } from 'vue'

import ControlsHost from './fixtures/controls-host.vue'
import { ACCOUNTS, createControlsSchema } from './fixtures/controls-schema'
import { mountDashboard } from './harness'

async function mountControls(options: {
  scenario: 'bar' | 'slots' | 'button' | 'presets' | 'pair'
  query?: Record<string, string>
}) {
  const { accounts, schema } = createControlsSchema()
  const harness = await mountDashboard({
    query: options.query ?? { view: 'usage' },
    render: (dashboard) => h(ControlsHost, { dashboard, scenario: options.scenario }),
    schema,
  })
  const pill = (key: string) => harness.wrapper.find(`[data-dashboard-filter="${key}"]`)
  async function open(key: string) {
    await pill(key).find('[data-ui-trigger]').trigger('click')
    await harness.flush()
  }
  const rows = (key: string) => pill(key).findAll('[data-filter-row]')
  /** Name and value shown on a pill (adjacent spans, spaced by the layout). */
  const parts = (key: string) =>
    pill(key)
      .findAll(':scope > [data-ui] > [data-ui-trigger] span, :scope > span > span')
      .map((part) => text(part.text()))
  return { ...harness, accounts, open, parts, pill, rows }
}

/** French text uses no-break spaces: compare with plain ones. */
function text(value: string) {
  return value.replace(/\s+/gu, ' ').trim()
}

describe('dashboard controls', () => {
  it('renders the root and current view filters, skipping headless and unset free values', async () => {
    const { dashboard, flush, parts, pill, wrapper } = await mountControls({ scenario: 'bar' })
    const keys = wrapper
      .findAll('[data-dashboard-filter]')
      .map((element) => element.attributes('data-dashboard-filter'))
    expect(keys).toEqual(['year', 'account', 'months', 'compare'])
    expect(parts('year')).toEqual(['Year', '2026'])
    expect(parts('account')).toEqual(['Account', 'All accounts'])
    expect(parts('months')).toEqual(['Months', 'Tous'])
    expect(parts('compare')).toEqual(['Compare', 'Oui'])
    expect(wrapper.find('[data-dashboard-filters-reset]').exists()).toBe(false)

    dashboard.usage.params.day = '2026-03-12'
    await flush()
    expect(parts('day')).toEqual(['Day', '2026-03-12'])
    expect(pill('day').find('[data-ui-trigger]').exists()).toBe(false)
    expect(pill('day').attributes('data-active')).toBeDefined()
  })

  it('picks single values, clears them, and resets the bar', async () => {
    const { dashboard, flush, open, pill, rows, wrapper } = await mountControls({ scenario: 'bar' })

    await open('year')
    expect(rows('year').map((row) => row.text())).toEqual(['2025', '2026'])
    await rows('year')[0]?.trigger('click')
    await flush()
    expect(dashboard.params.year).toBe(2025)
    expect(pill('year').find('[data-ui-content]').exists()).toBe(false)
    expect(pill('year').attributes('data-active')).toBeDefined()

    await pill('year').find('[data-dashboard-filter-clear]').trigger('click')
    await flush()
    expect(dashboard.params.year).toBe(2026)

    await open('compare')
    await rows('compare')[1]?.trigger('click')
    await flush()
    expect(dashboard.usage.params.compare).toBe(false)
    const reset = wrapper.find('[data-dashboard-filters-reset]')
    expect(text(reset.text())).toBe('Réinitialiser')
    await reset.trigger('click')
    await flush()
    expect(dashboard.usage.params.compare).toBe(true)
    expect(wrapper.find('[data-dashboard-filters-reset]').exists()).toBe(false)
  })

  it('toggles multiple values in a grid and clears the selection', async () => {
    const { dashboard, flush, open, parts, pill, query, rows } = await mountControls({
      scenario: 'bar',
    })

    await open('months')
    const list = pill('months').find('[data-filter-list]')
    expect(list.attributes('style')).toContain('repeat(3, minmax(0, 1fr))')
    await rows('months')[3]?.trigger('click')
    await rows('months')[1]?.trigger('click')
    await flush()
    expect(dashboard.usage.params.months).toEqual([2, 4])
    expect(query()).toMatchObject({ 'usage.months': '2,4' })
    // The menu stays open, with checked boxes.
    expect(pill('months').findAll('[data-checked]')).toHaveLength(2)
    expect(parts('months')).toEqual(['Months', 'M2, M4'])

    await pill('months').find('[data-filter-clear-selection]').trigger('click')
    await flush()
    expect(dashboard.usage.params.months).toEqual([])

    // Presets follow the options, under their own heading, and close the menu once applied.
    expect(pill('months').text()).toContain('Préréglages')
    await pill('months').find('[data-filter-preset]').trigger('click')
    await flush()
    expect(dashboard.usage.params.months).toEqual([1, 2, 3])
    expect(pill('months').find('[data-ui-content]').exists()).toBe(false)
  })

  it('opens each control of a shared handle on its own', async () => {
    const { flush, wrapper } = await mountControls({ scenario: 'pair' })
    const [options, presets] = wrapper.findAll('[data-ui="UPopover"]')
    await options?.find('[data-ui-trigger]').trigger('click')
    await flush()
    expect(wrapper.findAll('[data-ui-content]')).toHaveLength(1)
    expect(options?.find('[data-filter-list]').exists()).toBe(true)
    expect(presets?.find('[data-ui-content]').exists()).toBe(false)
  })

  it('lists only the presets from a presets button', async () => {
    const { dashboard, flush, wrapper } = await mountControls({ scenario: 'presets' })
    await wrapper.find('[data-ui-trigger]').trigger('click')
    await flush()
    const content = wrapper.find('[data-ui-content]')
    expect(content.find('[data-filter-list]').exists()).toBe(false)
    expect(content.text()).toContain('Préréglages')
    await content.find('[data-filter-preset]').trigger('click')
    await flush()
    expect(dashboard.usage.params.months).toEqual([1, 2, 3])
  })

  it('searches and picks from a remote list', async () => {
    const { accounts, dashboard, flush, open, parts, pill, rows, until } = await mountControls({
      scenario: 'bar',
    })

    await open('account')
    await until(() => accounts.calls.length > 0)
    accounts.calls[0]?.resolve(ACCOUNTS)
    await flush()
    expect(pill('account').find('[data-filter-search]').exists()).toBe(true)
    expect(rows('account').map((row) => text(row.text()))).toEqual([
      'All accounts',
      'Acme',
      'Globex',
      'Initech',
    ])
    await rows('account')[2]?.trigger('click')
    await flush()
    expect(dashboard.usage.params.account).toBe('a2')
    expect(parts('account')).toEqual(['Account', 'Globex'])
  })

  it('switches views from the tabs and shows only their filters', async () => {
    const { dashboard, flush, query, wrapper } = await mountControls({ scenario: 'bar' })
    const tabs = wrapper.findAll('[data-dashboard-view-tabs] button')
    expect(tabs.map((tab) => tab.text())).toEqual(['Funnel', 'Usage'])
    expect(tabs[1]?.attributes('aria-current')).toBe('page')

    await tabs[0]?.trigger('click')
    await flush()
    expect(dashboard.view.current).toBe('funnel')
    expect(query()).toEqual({})
    expect(
      wrapper
        .findAll('[data-dashboard-filter]')
        .map((element) => element.attributes('data-dashboard-filter')),
    ).toEqual(['year'])
  })

  it('lets slots replace one filter, every menu row, and add content', async () => {
    const { flush, open, pill, wrapper } = await mountControls({ scenario: 'slots' })
    expect(text(wrapper.find('[data-custom-account]').text())).toBe('Account: All accounts')
    expect(pill('compare').exists()).toBe(false)
    expect(wrapper.find('[data-trailing]').exists()).toBe(true)

    await open('months')
    await pill('months').findAll('[data-filter-row]')[0]?.trigger('click')
    await flush()
    expect(
      pill('months')
        .findAll('[data-custom-item]')
        .map((item) => item.text()),
    ).toHaveLength(6)
    expect(pill('months').find('[data-custom-item][data-on]').text()).toBe('M1')
  })

  it('renders a filter as a titled menu button with footer content', async () => {
    const { dashboard, flush, wrapper } = await mountControls({ scenario: 'button' })
    const button = wrapper.find('[data-dashboard-filter-button]')
    expect(text(button.text())).toBe('Add')

    await wrapper.find('[data-ui-trigger]').trigger('click')
    await flush()
    expect(wrapper.find('[data-ui-content]').text()).toContain('Months')
    await wrapper.find('[data-preset]').trigger('click')
    await flush()
    expect(dashboard.usage.params.months).toEqual([1, 2, 3])
  })
})
