import { describe, expect, it } from 'vitest'
import { h, ref } from 'vue'

import {
  defineDashboardFilters,
  defineDashboardSchema,
  defineDashboardView,
} from '#ui-tools/dashboard'
import DashboardPage from '#ui-tools/dashboard/components/dashboard-page.vue'

import { mountDashboard } from './harness'

type Workspace = 'ADMIN' | 'MANAGER'

/** Two views, the second one for administrators only. */
function createSchema(initial: Workspace = 'ADMIN') {
  const workspace = ref<Workspace>(initial)
  const context = defineDashboardFilters({
    workspace: (p) => p.enum(['ADMIN', 'MANAGER'], { defaultValue: 'ADMIN', sync: workspace }),
    year: (p) => p.enum([2025, 2026], { defaultValue: 2026, label: 'Year' }),
  })
  const sales = defineDashboardView({
    label: 'Sales',
    shared: context,
    queries: ({ essential }) => ({
      total: essential.query(() => ({
        queryFn: () => Promise.resolve({ amount: 3 }),
        queryKey: ['total'],
      })),
    }),
  })
  const margin = defineDashboardView({
    label: 'Margin',
    shared: context,
    enabled: ({ params }) => params.workspace === 'ADMIN',
  })
  const schema = defineDashboardSchema({
    key: 'page',
    params: context,
    views: { margin, sales },
  })
  return { schema, workspace }
}

describe('dashboard page', () => {
  it('renders the header, the pinned tabs and filters, and the current view from its slot', async () => {
    const { schema } = createSchema()
    const { dashboard, flush, wrapper } = await mountDashboard({
      query: { view: 'sales' },
      render: (api) =>
        h(
          DashboardPage,
          { actions: [{ icon: 'i-lucide-download', label: 'Export' }], dashboard: api, title: 'Board' },
          {
            margin: () => h('p', { 'data-view': 'margin' }, 'margin view'),
            sales: () => h('p', { 'data-view': 'sales' }, 'sales view'),
          },
        ),
      schema,
    })

    expect(wrapper.find('h1').text()).toBe('Board')
    // Today's date, then when the data on screen was fetched.
    const description = wrapper.find('header p').text()
    expect(description).toMatch(/\d{4}/u)
    expect(description).toContain('mis à jour')
    expect(wrapper.find('[data-dashboard-refresh]').exists()).toBe(true)
    const exportButton = wrapper.findComponent({ name: 'UButton' })
    expect(exportButton.text()).toBe('Export')
    // A labelled action with an icon keeps only its icon on phones.
    expect(exportButton.props('ui')).toEqual({ label: 'max-sm:sr-only' })

    const tabs = wrapper.findAll('[data-dashboard-view-tabs] button')
    expect(tabs.map((tab) => tab.text())).toEqual(['Margin', 'Sales'])
    expect(wrapper.find('[data-dashboard-filter="year"]').exists()).toBe(true)
    expect(wrapper.find('[data-view="sales"]').exists()).toBe(true)
    expect(wrapper.find('[data-view="margin"]').exists()).toBe(false)

    await tabs[0]?.trigger('click')
    await flush()
    expect(dashboard.view.current).toBe('margin')
    expect(wrapper.find('[data-view="margin"]').exists()).toBe(true)
    expect(wrapper.find('[data-view="sales"]').exists()).toBe(false)
  })

  it('drops the tab strip for a single view and falls back to the default slot', async () => {
    const { schema, workspace } = createSchema('MANAGER')
    const { flush, wrapper } = await mountDashboard({
      render: (api) =>
        h(
          DashboardPage,
          { dashboard: api, title: 'Board' },
          { default: ({ view }: { view: string | undefined }) => h('p', { 'data-fallback': view }) },
        ),
      schema,
    })

    expect(wrapper.find('[data-dashboard-view-tabs]').exists()).toBe(false)
    expect(wrapper.find('[data-fallback="sales"]').exists()).toBe(true)

    workspace.value = 'ADMIN'
    await flush()
    expect(wrapper.findAll('[data-dashboard-view-tabs] button')).toHaveLength(2)
  })

  it('leaves out what the page is told to, and takes custom parts from slots', async () => {
    const { schema } = createSchema()
    const { wrapper } = await mountDashboard({
      render: (api) =>
        h(
          DashboardPage,
          { dashboard: api, description: false, refresh: false, tabs: false, title: 'Board' },
          { filters: () => h('nav', { 'data-custom-filters': '' }) },
        ),
      schema,
    })

    expect(wrapper.find('header p').exists()).toBe(false)
    expect(wrapper.find('[data-dashboard-refresh]').exists()).toBe(false)
    expect(wrapper.find('[data-dashboard-view-tabs]').exists()).toBe(false)
    expect(wrapper.find('[data-custom-filters]').exists()).toBe(true)
    expect(wrapper.find('[data-dashboard-filter="year"]').exists()).toBe(false)
  })

  it('shows a fixed description instead of the date line', async () => {
    const { schema } = createSchema()
    const { wrapper } = await mountDashboard({
      render: (api) => h(DashboardPage, { dashboard: api, description: 'Quarterly review' }),
      schema,
    })

    expect(wrapper.find('header p').text()).toBe('Quarterly review')
  })
})
