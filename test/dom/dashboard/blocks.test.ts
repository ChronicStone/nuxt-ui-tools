import { describe, expect, it } from 'vitest'
import { h } from 'vue'

import { texts } from '../harness'
import BlocksHost from './fixtures/blocks-host.vue'
import { createBlockSources, createBlocksSchema } from './fixtures/blocks-schema'
import type { BlockScenario } from './fixtures/blocks-schema'
import TemplateInference from './fixtures/template-inference.vue'
import { mountDashboard } from './harness'

async function mountScenario(scenario: BlockScenario) {
  const sources = createBlockSources()
  const harness = await mountDashboard({
    render: (dashboard) => h(BlocksHost, { dashboard, scenario }),
    schema: createBlocksSchema(sources),
  })
  return { ...harness, sources }
}

describe('dashboard blocks', () => {
  it('keeps values out of the DOM while loading, then renders the stat with its delta', async () => {
    const { flush, sources, wrapper } = await mountScenario('stat')

    const card = wrapper.find('[data-phase]')
    expect(card.attributes('data-phase')).toBe('loading')
    expect(card.attributes('aria-busy')).toBe('true')
    expect(card.attributes('style')).toContain('grid-column: span 2 / span 2')
    expect(wrapper.text()).toContain('Revenue')
    expect(wrapper.text()).not.toContain('€')

    sources.summary.calls[0]?.resolve({ previous: 100, revenue: 125 })
    await flush()
    expect(wrapper.find('[data-phase]').attributes('data-phase')).toBe('content')
    expect(wrapper.text()).toContain('125 €')
    expect(wrapper.text()).toContain('+25')
    expect(wrapper.text()).toContain('vs 100')
  })

  it('shows a retryable error scoped to the failing block', async () => {
    const { flush, sources, wrapper } = await mountScenario('stat')

    sources.summary.calls[0]?.reject(new Error('boom'))
    await flush()
    expect(wrapper.find('[data-state="error"]').exists()).toBe(true)

    await wrapper.find('[data-state="error"] button').trigger('click')
    await flush()
    expect(sources.summary.calls).toHaveLength(2)
    sources.summary.calls[1]?.resolve({ previous: 1, revenue: 42 })
    await flush()
    expect(wrapper.find('[data-state="error"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('42')
  })

  it('renders ranked list rows', async () => {
    const { flush, sources, wrapper } = await mountScenario('list')

    sources.accounts.calls[0]?.resolve([
      { change: 12, kind: 'Company', name: 'Acme Corp', units: 1200 },
      { change: -4, kind: 'School', name: 'Globex', units: 800 },
    ])
    await flush()
    expect(texts(wrapper, 'li b')).toEqual(['Acme Corp', 'Globex'])
    expect(texts(wrapper, 'li > span:first-child')).toEqual(['AC', 'G'])
    expect(wrapper.find('li [data-trend="down"]').exists()).toBe(true)
    expect(wrapper.text()).toMatch(/1\s200/u)
  })

  it('shows the empty state when a ready source has no rows', async () => {
    const { flush, sources, wrapper } = await mountScenario('empty-list')

    sources.accounts.calls[0]?.resolve([])
    await flush()
    expect(wrapper.find('[data-state="empty"]').text()).toContain('No account yet')
  })

  it('passes typed data to widget slots and follows derived state', async () => {
    const { flush, sources, wrapper } = await mountScenario('widget')

    expect(wrapper.find('output').exists()).toBe(false)
    sources.summary.calls[0]?.resolve({ previous: 200, revenue: 250 })
    await flush()
    expect(wrapper.find('output').text()).toBe('25.0%')
  })

  it('activates deferred sources when the block mounts', async () => {
    const { flush, sources, wrapper } = await mountScenario('funnel')

    expect(sources.steps.calls).toHaveLength(1)
    sources.steps.calls[0]?.resolve([
      { count: 200, label: 'Registered' },
      { count: 150, label: 'Passed' },
    ])
    await flush()
    expect(texts(wrapper, 'ol li b')).toEqual(['Registered', 'Passed'])
    expect(wrapper.text()).toContain('base 100 %')
    expect(wrapper.text()).toMatch(/75\s%/u)
  })

  it('draws card chrome by default and panel chrome inside a panels grid', async () => {
    const { wrapper } = await mountScenario('panels')

    const [panel, standalone] = wrapper.findAll('section[data-phase]')
    expect(wrapper.find('[data-variant="panels"]').classes()).toContain('gap-px')
    expect(panel?.attributes('data-panel')).toBe('true')
    expect(panel?.classes()).toEqual(expect.arrayContaining(['rounded-none', 'border-0', 'px-6']))
    // Blocks forward `card`; an absent boolean prop must not turn the chrome off.
    expect(standalone?.attributes('data-panel')).toBeUndefined()
    expect(standalone?.classes()).toEqual(
      expect.arrayContaining(['rounded-lg', 'border', 'bg-default', 'px-6']),
    )
  })

  it('keeps the toolbar visible and reserves the footer while loading', async () => {
    const { flush, sources, wrapper } = await mountScenario('toolbar')

    expect(wrapper.find('[data-test="chip"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="total"]').exists()).toBe(false)
    expect(wrapper.find('footer[aria-hidden="true"] .nut-dash-ghost').exists()).toBe(true)

    sources.accounts.calls[0]?.resolve([{ change: 1, kind: 'Company', name: 'Acme', units: 3 }])
    await flush()
    expect(wrapper.find('[data-test="chip"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="total"]').exists()).toBe(true)
    expect(wrapper.find('footer[aria-hidden="true"]').exists()).toBe(false)
  })

  it('mounts blocks whose accessors are typed from their source', async () => {
    const sources = createBlockSources()
    const { wrapper } = await mountDashboard({
      render: (dashboard) => h(TemplateInference, { dashboard }),
      schema: createBlocksSchema(sources),
    })
    expect(wrapper.findAll('[data-phase="loading"]')).toHaveLength(3)
  })

  it('renders chart legends and hands the frame to the renderer', async () => {
    const { flush, sources, until, wrapper } = await mountScenario('bar-chart')

    expect(wrapper.find('[data-phase="loading"]').exists()).toBe(true)
    sources.months.calls[0]?.resolve([
      { billed: 90, month: 'Jan', used: 100 },
      { billed: 110, month: 'Feb', used: 120 },
    ])
    await flush()
    expect(texts(wrapper, 'header li')).toEqual(['Used', 'Billed', '2025'])
    await until(() => wrapper.find('[data-unovis]').exists())
  })
})
