import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'

import {
  defineDashboardFilter,
  defineDashboardFilters,
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

function createAdminSchema(overview: ReturnType<typeof deferredSource<Overview>>) {
  const periodFilters = defineDashboardFilters({
    year: defineDashboardFilter((p) => p.enum([2025, 2026], { defaultValue: 2026 })),
  })
  const usage = deferredSource<number[]>()
  const consumptionView = defineDashboardView({
    label: 'Consumption',
    shared: periodFilters,
    params: { account: (p) => p.string({ label: 'Account' }) },
    queries: ({ background, essential, params }) => {
      const query = () => ({
        queryFn: () => overview.fn(params.year, params.account),
        queryKey: ['overview', params.year, params.account],
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
            queryFn: () => usage.fn(required.map((product) => product.id)),
            queryKey: ['usage', required.map((product) => product.id)],
          }),
        }),
      }
    },
    derive: ({ data }) => ({ total: () => data.months.reduce((sum, row) => sum + row.units, 0) }),
  })
  const certificationsView = defineDashboardView({ label: 'Certifications', shared: periodFilters })
  const schema = defineDashboardSchema({
    key: 'admin',
    params: periodFilters,
    views: { consumption: consumptionView, certifications: certificationsView },
  })
  return { certificationsView, consumptionView, schema, usage }
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

    view.params.account = 'acme'
    await flush()
    // The previous result stays on screen while the new key loads.
    expect(view.products.state).toBe('ready')
    expect(view.products.refreshing).toBe(true)
    overview.calls[1]?.resolve({ months: [], products: [{ id: 'p1' }], summary: { units: 0 } })
    await flush()
    expect(usage.calls).toHaveLength(1)
    expect(usage.calls[0]?.args).toEqual([['p1']])
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

  it('merges shared params into view handles and resets what is on screen', async () => {
    const overview = deferredSource<Overview>()
    const { schema } = createAdminSchema(overview)
    const { dashboard, flush, query } = await mountDashboard({ schema })

    expect(Object.keys(dashboard.consumption.params)).toEqual(['year', 'account'])
    dashboard.consumption.params.year = 2025
    dashboard.consumption.params.account = 'acme'
    await flush()
    expect(dashboard.params.year).toBe(2025)
    expect(query()).toEqual({ 'consumption.account': 'acme', year: '2025' })
    expect(dashboard.filtered).toBe(true)

    dashboard.view.current = 'certifications'
    await flush()
    // The certifications view shows only the shared year.
    expect(dashboard.filtered).toBe(true)
    dashboard.resetFilters()
    await flush()
    expect(dashboard.params.year).toBe(2026)
    expect(dashboard.consumption.params.account).toBe('acme')
  })

  it('injects the dashboard and typed view handles into descendants', async () => {
    const overview = deferredSource<Overview>()
    const { consumptionView, schema } = createAdminSchema(overview)
    let injected: InferDashboardView<typeof consumptionView> | undefined
    let year: number | undefined
    const Tab = defineComponent({
      setup() {
        injected = useDashboardView(consumptionView)
        year = injectDashboard(schema).params.year
        return () => h('span')
      },
    })

    const { dashboard } = await mountDashboard({ render: () => h(Tab), schema })
    expect(injected).toBe(dashboard.consumption)
    expect(year).toBe(2026)
  })

  it('rejects a view reading shared params the root does not declare', async () => {
    const orphan = defineDashboardView({
      shared: { region: (p) => p.string() },
    })
    const schema = defineDashboardSchema({
      key: 'orphan',
      // @ts-expect-error the root does not declare `region`
      views: { orphan },
    })
    await expect(mountDashboard({ schema })).rejects.toThrow('shared param "region"')
  })
})
