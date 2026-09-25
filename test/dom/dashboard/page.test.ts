import { describe, expect, it } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import type { Ref } from 'vue'

import {
  defineDashboardSchema,
  defineDashboardView,
  useDashboard,
  useDashboardView,
} from '#ui-tools/dashboard'
import DashboardPage from '#ui-tools/dashboard/components/dashboard-page.vue'

import { mountDashboard } from './harness'

type Workspace = 'ADMIN' | 'MANAGER'

function salesView() {
  return defineDashboardView({
    label: 'Sales',
    filters: (f) => ({ year: f.enum([2025, 2026], { defaultValue: 2026, label: 'Year' }) }),
    queries: ({ essential }) => ({
      total: essential.query(() => ({
        queryFn: () => Promise.resolve({ amount: 3 }),
        queryKey: ['total'],
      })),
    }),
  })
}

function marginView(params: { workspace: Ref<Workspace> }) {
  return defineDashboardView({
    label: 'Margin',
    enabled: () => params.workspace.value === 'ADMIN',
    filters: (f) => ({ year: f.enum([2025, 2026], { defaultValue: 2026, label: 'Year' }) }),
  })
}

/** Two views, the second one for administrators only. */
function pageSchema(params: { workspace: Ref<Workspace> }) {
  return defineDashboardSchema({
    key: 'page',
    views: { margin: marginView(params), sales: salesView() },
  })
}

function createSchema(initial: Workspace = 'ADMIN') {
  const workspace = ref<Workspace>(initial)
  return { schema: pageSchema({ workspace }), workspace }
}

describe('dashboard page', () => {
  it('renders the header, the pinned tabs and filters, and the current view from its slot', async () => {
    const { schema } = createSchema()
    const { dashboard, flush, wrapper } = await mountDashboard({
      query: { view: 'sales' },
      render: (api) =>
        h(
          DashboardPage,
          {
            actions: [{ icon: 'i-lucide-download', label: 'Export' }],
            dashboard: api,
            title: 'Board',
          },
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
          {
            default: ({ view }: { view: string | undefined }) => h('p', { 'data-fallback': view }),
          },
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

  it('hands each view slot its view, so a view function finds it', async () => {
    const { schema } = createSchema()
    let sales: object | undefined
    let margin: object | undefined
    const SalesTab = defineComponent({
      setup() {
        sales = useDashboardView(salesView)
        return () => h('p', { 'data-view': 'sales' })
      },
    })
    const MarginTab = defineComponent({
      setup() {
        margin = useDashboardView(marginView)
        return () => h('p', { 'data-view': 'margin' })
      },
    })
    const { dashboard, flush } = await mountDashboard({
      query: { view: 'sales' },
      render: (api) =>
        h(
          DashboardPage,
          { dashboard: api },
          { margin: () => h(MarginTab), sales: () => h(SalesTab) },
        ),
      schema,
    })

    expect(sales).toBe(dashboard.sales)
    dashboard.view.current = 'margin'
    await flush()
    expect(margin).toBe(dashboard.margin)
  })

  it('lets a schema error thrown in setup be the only one reported', async () => {
    // Two views declare `status` differently: one key names one filter, so the dashboard throws.
    const conflicting = () =>
      defineDashboardSchema({
        key: 'conflicting',
        views: {
          open: defineDashboardView({
            filters: (f) => ({ status: f.enum(['open', 'closed'], { defaultValue: 'open' }) }),
          }),
          search: defineDashboardView({ filters: (f) => ({ status: f.string() }) }),
        },
      })
    // Like a compiled page: the render function is not setup's, so it still runs after setup threw.
    const Page = defineComponent({
      render() {
        return h(DashboardPage, { dashboard: this.dashboard, title: 'Conflicting' })
      },
      setup() {
        return { dashboard: useDashboard(conflicting) }
      },
    })
    const errors: unknown[] = []
    await expect(
      mountDashboard({
        onError: (error) => errors.push(error),
        render: () => h(Page),
        schema: defineDashboardSchema({ key: 'host' }),
      }),
    ).rejects.toThrow(/share the URL key "status"/u)
    // The page renders nothing without its dashboard, so no second error hides the first.
    expect(errors).toHaveLength(1)
  })

  it('shows a fixed description instead of the date line', async () => {
    const { schema } = createSchema()
    const { wrapper } = await mountDashboard({
      render: (api) => h(DashboardPage, { dashboard: api, description: 'Quarterly review' }),
      schema,
    })

    expect(wrapper.find('header p').text()).toBe('Quarterly review')
  })

  it('lays out an entity header and counts what waits in each view from the root data', async () => {
    const schema = defineDashboardSchema({
      key: 'entity',
      queries: ({ essential }) => ({
        account: essential.query(() => ({
          queryFn: () => Promise.resolve({ name: 'Acme', openInvoices: 3 }),
          queryKey: ['account'],
        })),
      }),
      views: {
        overview: defineDashboardView({ label: 'Overview' }),
        billing: defineDashboardView({ label: 'Billing' }),
        access: defineDashboardView({ label: 'Access' }),
      },
      badges: ({ data }) => ({ access: 0, billing: data.account?.openInvoices }),
    })
    const { flush, wrapper } = await mountDashboard({
      render: (api) =>
        h(
          DashboardPage,
          { dashboard: api, filters: false, refresh: false },
          {
            banner: () => h('aside', { 'data-banner': '' }, 'Internal note'),
            details: () => h('dl', { 'data-details': '' }, 'Facts'),
            eyebrow: () => h('nav', { 'data-eyebrow': '' }, 'Accounts'),
            leading: () => h('img', { alt: 'logo', 'data-leading-slot': '' }),
            overview: () => h('p', 'overview'),
            title: () => api.account.data?.name ?? '',
          },
        ),
      schema,
    })
    await flush()

    const header = wrapper.find('header')
    expect(header.attributes('data-leading')).toBe('')
    expect(header.find('[data-eyebrow]').exists()).toBe(true)
    expect(header.find('[data-leading-slot]').exists()).toBe(true)
    expect(header.find('[data-details]').exists()).toBe(true)
    expect(wrapper.find('h1').text()).toBe('Acme')
    expect(wrapper.find('[data-dashboard-refresh]').exists()).toBe(false)

    // The banner sits between the header and the pinned tabs.
    const banner = wrapper.find('[data-banner]').element
    const tabs = wrapper.find('[data-dashboard-view-tabs]').element
    expect(banner.compareDocumentPosition(tabs) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

    const badges = wrapper
      .findAll('[data-dashboard-view-tabs] button')
      .map((tab) => [tab.text(), tab.find('[data-dashboard-view-badge]').exists()])
    expect(badges).toEqual([
      ['Overview', false],
      ['Billing 3', true],
      ['Access', false],
    ])
  })
})
