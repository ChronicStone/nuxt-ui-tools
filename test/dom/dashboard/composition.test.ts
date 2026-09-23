import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'

import {
  defineDashboardSchema,
  defineDashboardView,
  injectDashboard,
  useDashboardView,
} from '#ui-tools/dashboard'
import type { InferDashboardView } from '#ui-tools/dashboard'

import { deferredSource, mountDashboard } from './harness'

interface Overview {
  summary: { units: number }
  months: { month: number; units: number }[]
  products: { id: string }[]
}

interface AdminSources {
  overview: ReturnType<typeof deferredSource<Overview>>
  usage: ReturnType<typeof deferredSource<number[]>>
}

function consumptionView(params: AdminSources) {
  return defineDashboardView({
    label: 'Consumption',
    filters: (f) => ({
      year: f.enum([2025, 2026], { defaultValue: 2026 }),
      account: f.string({ label: 'Account' }),
    }),
    queries: ({ background, essential, filters }) => {
      const query = () => ({
        queryFn: () => params.overview.fn(filters.year, filters.account),
        queryKey: ['overview', filters.year, filters.account],
      })
      const products = essential.query({ query, select: (data) => data.products })
      return {
        summary: essential.query({ query, select: (data) => data.summary }),
        months: essential.query({ defaultValue: [], query, select: (data) => data.months }),
        products,
        usage: background.query({
          defaultValue: [],
          requires: () => (products.data?.length ? products.data : null),
          query: ({ required }) => ({
            queryFn: () => params.usage.fn(required.map((product) => product.id)),
            queryKey: ['usage', required.map((product) => product.id)],
          }),
        }),
      }
    },
    derive: ({ data }) => ({ total: () => data.months.reduce((sum, row) => sum + row.units, 0) }),
  })
}

function certificationsView() {
  return defineDashboardView({
    label: 'Certifications',
    filters: (f) => ({ year: f.enum([2025, 2026], { defaultValue: 2026 }) }),
  })
}

function adminSchema(params: AdminSources) {
  return defineDashboardSchema({
    key: 'admin',
    views: { consumption: consumptionView(params), certifications: certificationsView() },
  })
}

function createAdminSchema(overview: AdminSources['overview']) {
  const usage = deferredSource<number[]>()
  return { schema: adminSchema({ overview, usage }), usage }
}

describe('dashboard composition', () => {
  it('splits one request with select and settles dependent queries', async () => {
    const overview = deferredSource<Overview>()
    const { schema, usage } = createAdminSchema(overview)
    const { dashboard, fetchedKeys, flush } = await mountDashboard({ schema })
    const view = dashboard.consumption

    expect(overview.calls).toHaveLength(1)
    expect(fetchedKeys()).toEqual(['["overview",2026,null]'])
    expect(view.usage.state).toBe('idle')

    overview.calls[0]?.resolve({
      months: [{ month: 1, units: 4 }],
      products: [],
      summary: { units: 4 },
    })
    await flush()
    expect(view.summary.data).toEqual({ units: 4 })
    expect(view.months.data).toEqual([{ month: 1, units: 4 }])
    expect(view.total.data).toBe(4)
    // No product to track: the dependent query settles on its default instead of waiting.
    expect(view.usage.state).toBe('ready')
    expect(view.usage.data).toEqual([])
    expect(usage.calls).toHaveLength(0)

    view.filters.account = 'acme'
    await flush()
    // The previous result stays on screen while the new key loads.
    expect(view.products.state).toBe('ready')
    expect(view.products.refreshing).toBe(true)
    overview.calls[1]?.resolve({ months: [], products: [{ id: 'p1' }], summary: { units: 0 } })
    await flush()
    expect(usage.calls).toHaveLength(1)
    expect(usage.calls[0]?.args).toEqual([['p1']])
  })

  it('selects again when a filter the selector reads changes, without refetching', async () => {
    const revenue = deferredSource<{ EUR: number; USD: number }>()
    const schema = defineDashboardSchema({
      key: 'revenue',
      filters: (f) => ({ currency: f.enum(['EUR', 'USD'], { defaultValue: 'EUR' }) }),
      queries: ({ essential, filters }) => ({
        revenue: essential.query({
          query: () => ({ queryFn: () => revenue.fn(), queryKey: ['revenue'] }),
          select: (data) => data[filters.currency],
        }),
      }),
    })
    const { dashboard, flush } = await mountDashboard({ schema })

    revenue.calls[0]?.resolve({ EUR: 10, USD: 12 })
    await flush()
    expect(dashboard.revenue.data).toBe(10)

    dashboard.filters.currency = 'USD'
    await flush()
    expect(dashboard.revenue.data).toBe(12)
    expect(revenue.calls).toHaveLength(1)
  })

  it('passes an upstream error on to its dependent query', async () => {
    const overview = deferredSource<Overview>()
    const { schema } = createAdminSchema(overview)
    const { dashboard, flush } = await mountDashboard({ schema })
    const view = dashboard.consumption

    // Background queries wait for essentials; then the dependent follows its upstream.
    overview.calls[0]?.reject(new Error('boom'))
    await flush()
    expect(view.products.state).toBe('error')
    expect(view.usage.state).toBe('error')
    expect(view.usage.error).toBeInstanceOf(Error)
  })

  it('shares a filter key across views and resets what is on screen', async () => {
    const overview = deferredSource<Overview>()
    const { schema } = createAdminSchema(overview)
    const { dashboard, flush, query } = await mountDashboard({ schema })

    expect(Object.keys(dashboard.consumption.filters)).toEqual(['year', 'account'])
    dashboard.consumption.filters.year = 2025
    dashboard.consumption.filters.account = 'acme'
    await flush()
    expect(dashboard.certifications.filters.year).toBe(2025)
    expect(query()).toEqual({ account: 'acme', year: '2025' })
    expect(dashboard.filtered).toBe(true)

    dashboard.view.current = 'certifications'
    await flush()
    // The certifications view shows only the year, which it shares with consumption.
    expect(dashboard.filtered).toBe(true)
    dashboard.resetFilters()
    await flush()
    expect(dashboard.certifications.filters.year).toBe(2026)
    expect(dashboard.consumption.filters.year).toBe(2026)
    expect(dashboard.consumption.filters.account).toBe('acme')
  })

  it('injects the dashboard and typed view handles into descendants', async () => {
    const overview = deferredSource<Overview>()
    const { schema } = createAdminSchema(overview)
    let injected: InferDashboardView<typeof consumptionView> | undefined
    let year: number | undefined
    const Tab = defineComponent({
      setup() {
        // Outside a view slot, a view function reads the view on screen.
        injected = useDashboardView(consumptionView)
        year = injectDashboard(adminSchema).consumption.filters.year
        return () => h('span')
      },
    })

    const { dashboard } = await mountDashboard({ render: () => h(Tab), schema })
    expect(injected).toBe(dashboard.consumption)
    expect(year).toBe(2026)
  })

  it('finds a view object by identity, wherever the component renders', async () => {
    const view = defineDashboardView({
      label: 'Second',
      filters: (f) => ({ region: f.string() }),
    })
    const schema = defineDashboardSchema({
      key: 'identity',
      views: { first: defineDashboardView({ label: 'First' }), second: view },
    })
    let found: InferDashboardView<typeof view> | undefined
    const Probe = defineComponent({
      setup() {
        found = useDashboardView(view)
        return () => h('span')
      },
    })

    const { dashboard } = await mountDashboard({ render: () => h(Probe), schema })
    expect(dashboard.view.current).toBe('first')
    expect(found).toBe(dashboard.second)
  })
})
