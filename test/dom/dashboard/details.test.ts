import { describe, expect, it } from 'vitest'
import { h } from 'vue'

import { defineDashboardSchema } from '#ui-tools/dashboard'

import DetailsHost from './fixtures/details-host.vue'
import type { Profile } from './fixtures/details-host.vue'
import { deferredSource, mountDashboard } from './harness'

async function mountDetails() {
  const source = deferredSource<Profile>()
  const harness = await mountDashboard({
    render: (dashboard) => h(DetailsHost, { source: dashboard.profile }),
    schema: defineDashboardSchema({
      key: 'details',
      queries: ({ essential }) => ({
        profile: essential.query(() => ({ queryFn: source.fn, queryKey: ['profile'] })),
      }),
    }),
  })
  return { ...harness, source }
}

describe('dashboard details', () => {
  it('lists the fields of a record with their placeholders, formats, links, and slots', async () => {
    const { flush, source, wrapper } = await mountDetails()

    expect(wrapper.find('[data-phase]').attributes('data-phase')).toBe('loading')
    expect(wrapper.find('dl').exists()).toBe(false)

    source.calls[0]?.resolve({
      kind: 'customer',
      name: 'Acme',
      units: 12_500,
      vatNumber: null,
      website: 'https://acme.test',
    })
    await flush()

    const items = wrapper.findAll('[data-details-item]')
    expect(items.map((item) => item.find('dt').text())).toEqual([
      'Name',
      'VAT',
      'Units',
      'Website',
      'Kind',
    ])
    expect(items[1]?.attributes('data-empty')).toBe('')
    expect(items[1]?.find('dd').text()).toBe('Not provided')
    expect(items[1]?.find('button').exists()).toBe(false)
    expect(items[2]?.find('dd').text().replace(/\s/gu, ' ')).toBe('12 500')
    expect(items[2]?.attributes('style')).toContain('grid-column: 1 / -1')
    expect(items[3]?.find('[data-details-link]').attributes('to')).toBe('https://acme.test')
    expect(items[4]?.find('mark').text()).toBe('CUSTOMER')
  })

  it('offers a copy button once an identifier has a value, and shows fields for its record', async () => {
    const { flush, source, wrapper } = await mountDetails()

    source.calls[0]?.resolve({
      kind: 'partner',
      name: 'Globex',
      units: 1,
      vatNumber: 'FR123',
      website: null,
    })
    await flush()

    const labels = wrapper.findAll('[data-details-item] dt').map((label) => label.text())
    expect(labels).toContain('Commission')
    const [name, vat] = wrapper.findAll('[data-details-item]')
    expect(name?.find('button').exists()).toBe(false)
    expect(vat?.find('button').attributes('aria-label')).toBe('Copier')
  })
})
