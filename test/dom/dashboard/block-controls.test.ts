import { describe, expect, it } from 'vitest'
import { h } from 'vue'

import { defineDashboardSchema } from '#ui-tools/dashboard'
import DashboardLineChart from '#ui-tools/dashboard/components/dashboard-line-chart.vue'
import DashboardList from '#ui-tools/dashboard/components/dashboard-list.vue'
import DashboardWidget from '#ui-tools/dashboard/components/dashboard-widget.vue'

import { mountDashboard } from './harness'

interface UsageRow {
  month: number
  units: Record<string, number>
}

const USAGE: UsageRow[] = [
  { month: 1, units: { a: 4, b: 2, c: 1 } },
  { month: 2, units: { a: 6, b: 3, c: 0 } },
]

function createSchema() {
  return defineDashboardSchema({
    key: 'controls',
    filters: (f) => ({
      day: f.string({ label: 'Day' }),
      tracked: f.options(
        [
          { label: 'Alpha', value: 'a' },
          { label: 'Beta', value: 'b' },
          { label: 'Gamma', value: 'c' },
        ],
        {
          label: 'Products',
          multiple: true,
          presets: [{ label: 'Everything', value: ['a', 'b', 'c'] }],
        },
      ),
    }),
    queries: ({ essential }) => ({
      usage: essential.query(() => ({
        queryFn: () => Promise.resolve(USAGE),
        queryKey: ['usage'],
      })),
      accounts: essential.query(() => ({
        queryFn: () => Promise.resolve([{ id: 'acme', name: 'Acme', units: 3 }]),
        queryKey: ['accounts'],
      })),
    }),
  })
}

describe('dashboard block controls', () => {
  it('takes a chart series from each option a filter picks, with a picker and removable chips', async () => {
    const { dashboard, flush, wrapper } = await mountDashboard({
      render: (api) =>
        h(DashboardLineChart<UsageRow, string>, {
          series: api.controls.tracked,
          seriesValue: (row: UsageRow, product: string) => row.units[product],
          source: api.usage,
          title: 'Usage',
          x: (row: UsageRow) => row.month,
        }),
      schema: createSchema(),
    })
    dashboard.filters.tracked = ['a', 'b']
    await flush()

    // One chip per picked option, in the palette order of the series; the chips replace the legend.
    const chips = wrapper.findAll('[data-dashboard-chip]')
    expect(chips.map((chip) => chip.text())).toEqual(['Alpha', 'Beta'])
    expect(chips.map((chip) => chip.find('i').attributes('style'))).toEqual([
      'background: var(--nut-dash-s1);',
      'background: var(--nut-dash-s2);',
    ])
    expect(wrapper.find('[data-dashboard-legend]').exists()).toBe(false)
    // The picker adds from the options and applies presets.
    const buttons = wrapper.findAll('[data-series-picker] [data-dashboard-filter-button]')
    expect(buttons.map((button) => button.text())).toEqual(['Ajouter', 'Préréglages'])

    await chips[1]?.find('button').trigger('click')
    await flush()
    expect(dashboard.filters.tracked).toEqual(['a'])
    expect(wrapper.findAll('[data-dashboard-chip]').map((chip) => chip.text())).toEqual(['Alpha'])

    dashboard.filters.tracked = []
    await flush()
    expect(wrapper.findAll('[data-dashboard-chip]')).toHaveLength(0)
    expect(wrapper.find('section').attributes('data-phase')).toBe('empty')
  })

  it('shows the drill-down filters narrowing a block as removable chips while they are set', async () => {
    const { dashboard, flush, wrapper } = await mountDashboard({
      render: (api) =>
        h(
          DashboardWidget,
          { filters: [api.controls.day], source: api.usage, title: 'Detail' },
          { default: () => h('p', 'content') },
        ),
      schema: createSchema(),
    })
    await flush()
    expect(wrapper.find('[data-dashboard-chip]').exists()).toBe(false)

    dashboard.filters.day = '2026-09-12'
    await flush()
    const chip = wrapper.find('[data-dashboard-chip]')
    expect(chip.text()).toBe('Day2026-09-12')
    expect(chip.find('button').attributes('aria-label')).toBe('Effacer le filtre Day')

    await chip.find('button').trigger('click')
    await flush()
    expect(dashboard.filters.day).toBeUndefined()
    expect(wrapper.find('[data-dashboard-chip]').exists()).toBe(false)
  })

  it('draws a header link as a text link with a chevron, and keeps explicit looks', async () => {
    const { flush, wrapper } = await mountDashboard({
      render: (api) =>
        h(
          DashboardWidget,
          {
            actions: [
              { label: 'All', to: '/accounts' },
              { label: 'Export', to: '/export', variant: 'solid' },
            ],
            source: api.usage,
            title: 'Accounts',
          },
          { default: () => h('p', 'content') },
        ),
      schema: createSchema(),
    })
    await flush()

    const [link, button] = wrapper.findAll('[data-dashboard-action]')
    expect(link?.attributes('data-variant')).toBe('link')
    expect(link?.attributes('data-trailing-icon')).toBe('i-lucide-chevron-right')
    expect(button?.attributes('data-variant')).toBe('solid')
    expect(button?.attributes('data-trailing-icon')).toBeUndefined()
  })

  it('makes list rows links', async () => {
    const { flush, wrapper } = await mountDashboard({
      render: (api) =>
        h(DashboardList<{ id: string; name: string; units: number }>, {
          label: (account: { name: string }) => account.name,
          source: api.accounts,
          title: 'Accounts',
          to: (account: { id: string }) => `/accounts/${account.id}`,
          value: (account: { units: number }) => account.units,
        }),
      schema: createSchema(),
    })
    await flush()

    const link = wrapper.find('[data-row-link]')
    expect(link.attributes('to')).toBe('/accounts/acme')
    expect(link.attributes('aria-label')).toBe('Acme')
  })
})
