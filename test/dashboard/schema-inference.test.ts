import { describe, expectTypeOf, it } from 'vitest'

import { defineDashboardSchema, defineDashboardView, useDashboard } from '#ui-tools/dashboard'
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

function consumptionView(params: { region: string }) {
  return defineDashboardView({
    label: 'Consommation',
    filters: (f) => ({
      year: f.enum([2024, 2025, 2026], { defaultValue: 2026 }),
      currency: f.enum(['EUR', 'USD'], { defaultValue: 'EUR' }),
      account: f.remote({
        load: async () => ({ hasMore: false, options: [] }),
      }),
      compare: f.boolean({ defaultValue: true }),
    }),
    queries: ({ essential, background, deferred, filters }) => {
      expectTypeOf(filters.year).toEqualTypeOf<2024 | 2025 | 2026>()
      expectTypeOf(filters.currency).toEqualTypeOf<'EUR' | 'USD'>()
      expectTypeOf(filters.account).toEqualTypeOf<string | undefined>()

      const accounts = essential.query(() => ({
        queryKey: ['accounts', params.region, filters.year],
        queryFn: () => api.accounts(filters.year),
      }))

      return {
        accounts,
        productLines: essential.query({
          filters: (f) => ({
            tracked: f.enum(PRODUCTS, { defaultValue: ['en-gen'], multiple: true }),
          }),
          defaultValue: [],
          query: ({ filters: own }) => {
            expectTypeOf(own.tracked).toEqualTypeOf<('en-gen' | 'en-biz' | 'fr-gen')[]>()
            return {
              queryKey: ['lines', filters.year, own.tracked],
              queryFn: () => api.consumption({ products: own.tracked, year: filters.year }),
            }
          },
        }),
        accountDetail: background.query({
          requires: () => filters.account,
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
      firstAccount: () => data.accounts?.[0]?.name,
    }),
  })
}

function candidatesView() {
  return defineDashboardView({
    filters: (f) => ({ months: f.enum([1, 2, 3], { multiple: true }) }),
    queries: ({ deferred, filters }) => ({
      funnel: deferred.query({
        defaultValue: [],
        query: () => ({
          queryKey: ['funnel', filters.months],
          queryFn: () => api.funnel(filters.months),
        }),
      }),
    }),
  })
}

function analyticsSchema(params: { region: string }) {
  return defineDashboardSchema({
    key: 'analytics',
    filters: (f) => ({
      year: f.enum([2024, 2025, 2026], { defaultValue: 2026 }),
    }),
    queries: ({ essential, filters }) => {
      expectTypeOf(filters.year).toEqualTypeOf<2024 | 2025 | 2026>()
      return {
        summary: essential.query(() => ({
          queryKey: ['summary', filters.year],
          queryFn: () => api.summary(filters.year),
        })),
      }
    },
    derive: ({ data }) => ({
      revenue: () => data.summary?.revenue ?? 0,
    }),
    views: { consumption: consumptionView(params), candidates: candidatesView() },
  })
}

const mountAnalytics = () => useDashboard(() => analyticsSchema({ region: 'eu' }))
declare const dashboard: ReturnType<typeof mountAnalytics>

const single = defineDashboardSchema({
  key: 'sales',
  filters: (f) => ({
    period: f.enum([7, 30, 90], { defaultValue: 30 }),
    search: f.string(),
    range: f.dateRange(),
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
  it('infers the filters of the root, of each view, and of single queries', () => {
    expectTypeOf<typeof dashboard.filters.year>().toEqualTypeOf<2024 | 2025 | 2026>()
    expectTypeOf<typeof dashboard.consumption.filters.year>().toEqualTypeOf<2024 | 2025 | 2026>()
    expectTypeOf<typeof dashboard.consumption.filters.currency>().toEqualTypeOf<'EUR' | 'USD'>()
    expectTypeOf<typeof dashboard.consumption.filters.account>().toEqualTypeOf<string | undefined>()
    expectTypeOf<typeof dashboard.consumption.filters.compare>().toEqualTypeOf<boolean>()
    expectTypeOf<typeof dashboard.consumption.productLines.filters.tracked>().toEqualTypeOf<
      ('en-gen' | 'en-biz' | 'fr-gen')[]
    >()
    expectTypeOf<typeof dashboard.candidates.filters.months>().toEqualTypeOf<(1 | 2 | 3)[]>()
    expectTypeOf<keyof typeof dashboard.filters>().toEqualTypeOf<'year'>()
    // A view only sees the filters it declares.
    expectTypeOf<keyof typeof dashboard.candidates.filters>().toEqualTypeOf<'months'>()
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
    expectTypeOf<typeof dashboard.consumption.firstAccount.data>().toEqualTypeOf<
      string | undefined
    >()
    expectTypeOf<typeof dashboard.consumption.ytd>().toExtend<DashboardSourceLike<number>>()
  })

  it('exposes a control per filter', () => {
    expectTypeOf<keyof typeof dashboard.consumption.controls>().toEqualTypeOf<
      'year' | 'currency' | 'account' | 'compare'
    >()
    expectTypeOf<typeof dashboard.consumption.controls.account.value>().toEqualTypeOf<
      string | undefined
    >()
    expectTypeOf<typeof dashboard.consumption.controls.currency.items>().toEqualTypeOf<
      readonly DashboardOption<'EUR' | 'USD'>[]
    >()
    expectTypeOf<typeof dashboard.candidates.controls.months.toggle>().toEqualTypeOf<
      (value: 1 | 2 | 3) => void
    >()
    expectTypeOf<
      keyof typeof dashboard.consumption.productLines.controls
    >().toEqualTypeOf<'tracked'>()
  })

  it('types the view controller', () => {
    expectTypeOf<typeof dashboard.view.current>().toEqualTypeOf<'consumption' | 'candidates'>()
    expectTypeOf<typeof dashboard.consumption.view.key>().toEqualTypeOf<'consumption'>()
  })

  it('supports single-view dashboards declared as objects', () => {
    expectTypeOf<typeof sales.filters.period>().toEqualTypeOf<7 | 30 | 90>()
    expectTypeOf<typeof sales.filters.search>().toEqualTypeOf<string | undefined>()
    expectTypeOf<typeof sales.summary.data>().toEqualTypeOf<Summary | undefined>()
    expectTypeOf<typeof sales>().not.toHaveProperty('view')
  })

  it('accepts views without queries or derived values', () => {
    const labelOnly = defineDashboardSchema({
      key: 'label-only',
      views: {
        overview: defineDashboardView({ label: 'Overview' }),
        search: defineDashboardView({ filters: (f) => ({ term: f.string() }) }),
      },
    })
    const mountLabelOnly = () => useDashboard(labelOnly)
    type LabelOnly = ReturnType<typeof mountLabelOnly>
    expectTypeOf<LabelOnly['view']['current']>().toEqualTypeOf<'overview' | 'search'>()
    expectTypeOf<LabelOnly['search']['filters']['term']>().toEqualTypeOf<string | undefined>()
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
      // @ts-expect-error `filters` is a runtime member of the facade
      queries: ({ essential }) => ({
        filters: essential.query(() => ({ queryKey: ['x'], queryFn: () => api.summary(1) })),
      }),
    })

    defineDashboardSchema({
      key: 'reserved-controls',
      // @ts-expect-error `controls` is a runtime member of the facade
      derive: () => ({ controls: () => 1 }),
    })

    defineDashboardSchema({
      key: 'collision',
      queries: ({ essential }) => ({
        summary: essential.query(() => ({ queryKey: ['x'], queryFn: () => api.summary(1) })),
      }),
      // @ts-expect-error a view cannot reuse a root query key
      views: { summary: defineDashboardView({}) },
    })

    defineDashboardView({
      // @ts-expect-error a view query cannot use a reserved facade member
      queries: ({ essential }) => ({
        refresh: essential.query(() => ({ queryKey: ['x'], queryFn: () => api.summary(1) })),
      }),
    })

    defineDashboardSchema({
      key: 'auto-refresh',
      // @ts-expect-error `autoRefresh` is a runtime member of the facade
      derive: () => ({ autoRefresh: () => 1 }),
    })
  })

  it('types comparison filters and the writable auto-refresh interval', () => {
    const compared = defineDashboardSchema({
      key: 'compared',
      filters: (f) => ({
        compare: f.comparison({ defaultValue: 'previous' }),
        optional: f.comparison(),
      }),
    })
    const mountCompared = () => useDashboard(compared)
    type Compared = ReturnType<typeof mountCompared>
    expectTypeOf<Compared['filters']['compare']>().toEqualTypeOf<'previous' | 'year' | 'none'>()
    expectTypeOf<Compared['filters']['optional']>().toEqualTypeOf<
      'previous' | 'year' | 'none' | undefined
    >()
    expectTypeOf<keyof Compared['controls']>().toEqualTypeOf<'compare' | 'optional'>()
    expectTypeOf<Compared['autoRefresh']>().toEqualTypeOf<number>()
  })
})
