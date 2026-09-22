import { describe, expectTypeOf, it } from 'vitest'

import { defineDashboardSchema, useDashboard } from '#ui-tools/dashboard'
import type {
  DashboardOption,
  DashboardReadyData,
  DashboardSourceLike,
  DashboardSourceRow,
} from '#ui-tools/dashboard'

interface Account {
  id: string
  name: string
}
interface ConsumptionPoint {
  month: number
  used: number
  billed: number
}
interface Summary {
  revenue: number
  orders: number
}

declare const api: {
  summary: (year: number) => Promise<Summary>
  accounts: (year: number) => Promise<Account[]>
  accountDetail: (id: string) => Promise<{ spend: number }>
  consumption: (input: { year: number; products: string[] }) => Promise<ConsumptionPoint[]>
  funnel: (months: number[]) => Promise<{ step: string; count: number }[]>
}

const PRODUCTS = ['en-gen', 'en-biz', 'fr-gen'] as const

const analytics = defineDashboardSchema({
  key: 'analytics',
  params: (p) => ({
    year: p.enum([2024, 2025, 2026], { defaultValue: 2026 }),
  }),
  queries: ({ essential, params }) => {
    expectTypeOf(params.year).toEqualTypeOf<2024 | 2025 | 2026>()
    return {
      summary: essential.query(() => ({
        queryKey: ['summary', params.year],
        queryFn: () => api.summary(params.year),
      })),
    }
  },
  derive: ({ data }) => ({
    revenue: () => data.summary?.revenue ?? 0,
  }),
  views: (view) => ({
    consumption: view({
      label: 'Consommation',
      params: (p) => ({
        currency: p.enum(['EUR', 'USD'], { defaultValue: 'EUR' }),
        account: p.remote({
          load: async () => ({ hasMore: false, options: [] }),
        }),
        compare: p.boolean({ defaultValue: true }),
      }),
      queries: ({ essential, background, deferred, params }) => {
        expectTypeOf(params.year).toEqualTypeOf<2024 | 2025 | 2026>()
        expectTypeOf(params.currency).toEqualTypeOf<'EUR' | 'USD'>()
        expectTypeOf(params.account).toEqualTypeOf<string | undefined>()

        const accounts = essential.query(() => ({
          queryKey: ['accounts', params.year],
          queryFn: () => api.accounts(params.year),
        }))

        return {
          accounts,
          productLines: essential.query({
            params: (p) => ({
              tracked: p.enum(PRODUCTS, { defaultValue: ['en-gen'], multiple: true }),
            }),
            defaultValue: [],
            query: ({ params: widget }) => {
              expectTypeOf(widget.tracked).toEqualTypeOf<('en-gen' | 'en-biz' | 'fr-gen')[]>()
              return {
                queryKey: ['lines', params.year, widget.tracked],
                queryFn: () => api.consumption({ products: widget.tracked, year: params.year }),
              }
            },
          }),
          accountDetail: background.query({
            requires: () => params.account,
            query: ({ required }) => {
              expectTypeOf(required).toEqualTypeOf<string>()
              return {
                queryKey: ['account', required],
                queryFn: () => api.accountDetail(required),
              }
            },
          }),
          ranking: deferred.query({
            requires: () => accounts.data,
            defaultValue: [],
            query: ({ required }) => {
              expectTypeOf(required).toEqualTypeOf<Account[]>()
              return {
                queryKey: ['ranking', required.length],
                queryFn: () => api.accounts(required.length),
              }
            },
          }),
        }
      },
      derive: ({ data }) => ({
        ytd: () => data.productLines.reduce((sum, point) => sum + point.used, 0),
        headline: () => data.summary?.orders,
      }),
    }),
    candidates: view({
      params: (p) => ({ months: p.enum([1, 2, 3], { multiple: true }) }),
      queries: ({ deferred, params }) => ({
        funnel: deferred.query({
          defaultValue: [],
          query: () => ({
            queryKey: ['funnel', params.months],
            queryFn: () => api.funnel(params.months),
          }),
        }),
      }),
    }),
  }),
})

const mountAnalytics = () => useDashboard(analytics)
declare const dashboard: ReturnType<typeof mountAnalytics>

const single = defineDashboardSchema({
  key: 'sales',
  params: (p) => ({
    period: p.enum([7, 30, 90], { defaultValue: 30 }),
    search: p.string(),
    range: p.dateRange(),
  }),
  queries: ({ essential }) => ({
    summary: essential.query(() => ({
      queryKey: ['summary'],
      queryFn: () => api.summary(2026),
    })),
  }),
})

const mountSales = () => useDashboard(single)
declare const sales: ReturnType<typeof mountSales>

describe('dashboard schema inference', () => {
  it('infers shared, view, and widget params', () => {
    expectTypeOf<typeof dashboard.params.year>().toEqualTypeOf<2024 | 2025 | 2026>()
    expectTypeOf<typeof dashboard.consumption.params.currency>().toEqualTypeOf<'EUR' | 'USD'>()
    expectTypeOf<typeof dashboard.consumption.params.account>().toEqualTypeOf<string | undefined>()
    expectTypeOf<typeof dashboard.consumption.params.compare>().toEqualTypeOf<boolean>()
    expectTypeOf<typeof dashboard.consumption.productLines.params.tracked>().toEqualTypeOf<
      ('en-gen' | 'en-biz' | 'fr-gen')[]
    >()
    expectTypeOf<typeof dashboard.candidates.params.months>().toEqualTypeOf<(1 | 2 | 3)[]>()
    expectTypeOf<keyof typeof dashboard.params>().toEqualTypeOf<'year'>()
  })

  it('infers resource data with and without defaults', () => {
    expectTypeOf<typeof dashboard.summary.data>().toEqualTypeOf<Summary | undefined>()
    expectTypeOf<typeof dashboard.consumption.accounts.data>().toEqualTypeOf<
      Account[] | undefined
    >()
    expectTypeOf<typeof dashboard.consumption.productLines.data>().toEqualTypeOf<
      ConsumptionPoint[]
    >()
    expectTypeOf<typeof dashboard.consumption.ranking.data>().toEqualTypeOf<Account[]>()
    expectTypeOf<typeof dashboard.consumption.ranking.stage>().toEqualTypeOf<'deferred'>()
    expectTypeOf<typeof dashboard.consumption.accountDetail.stage>().toEqualTypeOf<'background'>()
  })

  it('exposes derived values as resources', () => {
    expectTypeOf<typeof dashboard.revenue.data>().toEqualTypeOf<number>()
    expectTypeOf<typeof dashboard.consumption.ytd.data>().toEqualTypeOf<number>()
    expectTypeOf<typeof dashboard.consumption.headline.data>().toEqualTypeOf<number | undefined>()
    expectTypeOf<typeof dashboard.consumption.ytd>().toExtend<DashboardSourceLike<number>>()
  })

  it('exposes a filter handle per param, root params included on view handles', () => {
    expectTypeOf<keyof typeof dashboard.consumption.filters>().toEqualTypeOf<
      'year' | 'currency' | 'account' | 'compare'
    >()
    expectTypeOf<typeof dashboard.consumption.params.year>().toEqualTypeOf<2024 | 2025 | 2026>()
    expectTypeOf<typeof dashboard.consumption.filters.account.value>().toEqualTypeOf<
      string | undefined
    >()
    expectTypeOf<typeof dashboard.consumption.filters.currency.items>().toEqualTypeOf<
      readonly DashboardOption<'EUR' | 'USD'>[]
    >()
    expectTypeOf<typeof dashboard.candidates.filters.months.toggle>().toEqualTypeOf<
      (value: 1 | 2 | 3) => void
    >()
  })

  it('types the view controller', () => {
    expectTypeOf<typeof dashboard.view.current>().toEqualTypeOf<'consumption' | 'candidates'>()
    expectTypeOf<typeof dashboard.consumption.view.key>().toEqualTypeOf<'consumption'>()
  })

  it('supports single-view dashboards', () => {
    expectTypeOf<typeof sales.params.period>().toEqualTypeOf<7 | 30 | 90>()
    expectTypeOf<typeof sales.params.search>().toEqualTypeOf<string | undefined>()
    expectTypeOf<typeof sales.summary.data>().toEqualTypeOf<Summary | undefined>()
    expectTypeOf<typeof sales>().not.toHaveProperty('view')
  })

  it('accepts views without queries or derived values', () => {
    const labelOnly = defineDashboardSchema({
      key: 'label-only',
      views: (view) => ({
        overview: view({ label: 'Overview' }),
        search: view({ params: (p) => ({ term: p.string() }) }),
      }),
    })
    const mountLabelOnly = () => useDashboard(labelOnly)
    type LabelOnly = ReturnType<typeof mountLabelOnly>
    expectTypeOf<LabelOnly['view']['current']>().toEqualTypeOf<'overview' | 'search'>()
    expectTypeOf<LabelOnly['search']['params']['term']>().toEqualTypeOf<string | undefined>()
  })

  it('derives ready data and rows for blocks', () => {
    expectTypeOf<DashboardReadyData<typeof dashboard.summary>>().toEqualTypeOf<Summary>()
    expectTypeOf<
      DashboardSourceRow<typeof dashboard.consumption.productLines>
    >().toEqualTypeOf<ConsumptionPoint>()
  })

  it('rejects reserved and colliding keys', () => {
    defineDashboardSchema({
      key: 'reserved',
      // @ts-expect-error `params` is a runtime member of the facade
      queries: ({ essential }) => ({
        params: essential.query(() => ({ queryKey: ['x'], queryFn: () => api.summary(1) })),
      }),
    })

    defineDashboardSchema({
      key: 'collision',
      queries: ({ essential }) => ({
        summary: essential.query(() => ({ queryKey: ['x'], queryFn: () => api.summary(1) })),
      }),
      // @ts-expect-error a view cannot reuse a root query key
      views: (view) => ({ summary: view({}) }),
    })

    defineDashboardSchema({
      key: 'view-member',
      // @ts-expect-error a view query cannot use a reserved facade member
      views: (view) => ({
        main: view({
          queries: ({ essential }) => ({
            refresh: essential.query(() => ({ queryKey: ['x'], queryFn: () => api.summary(1) })),
          }),
        }),
      }),
    })

    defineDashboardSchema({
      key: 'auto-refresh',
      // @ts-expect-error `autoRefresh` is a runtime member of the facade
      derive: () => ({ autoRefresh: () => 1 }),
    })
  })

  it('types comparison params and the writable auto-refresh interval', () => {
    const compared = defineDashboardSchema({
      key: 'compared',
      params: (p) => ({
        compare: p.comparison({ defaultValue: 'previous' }),
        optional: p.comparison(),
      }),
    })
    const mountCompared = () => useDashboard(compared)
    type Compared = ReturnType<typeof mountCompared>
    expectTypeOf<Compared['params']['compare']>().toEqualTypeOf<'previous' | 'year' | 'none'>()
    expectTypeOf<Compared['params']['optional']>().toEqualTypeOf<
      'previous' | 'year' | 'none' | undefined
    >()
    expectTypeOf<keyof Compared['options']>().toEqualTypeOf<'compare' | 'optional'>()
    expectTypeOf<Compared['autoRefresh']>().toEqualTypeOf<number>()
  })
})
