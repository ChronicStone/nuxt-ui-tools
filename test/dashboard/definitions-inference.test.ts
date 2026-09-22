import { describe, expectTypeOf, it } from 'vitest'
import { ref } from 'vue'

import {
  defineDashboardFilter,
  defineDashboardFilters,
  defineDashboardSchema,
  defineDashboardView,
  useDashboard,
  useDashboardView,
} from '#ui-tools/dashboard'
import type {
  DashboardFilterHandle,
  DashboardOption,
  InferDashboard,
  InferDashboardView,
} from '#ui-tools/dashboard'

interface Overview {
  summary: { units: number; previous: number }
  months: { month: number; units: number }[]
  products: { id: string; name: string }[]
}

/** Data the getter defaults read, as a loaded query would expose it. */
declare const latest: { year: 2025 | 2026; ids: string[] }
declare const loaded: { products?: { id: string }[] }

declare const api: {
  overview: (input: { year: number; account?: string }) => Promise<Overview>
  usage: (ids: string[]) => Promise<{ month: number; units: Record<string, number> }[]>
}

const yearFilter = defineDashboardFilter((p) =>
  p.enum([2024, 2025, 2026], { defaultValue: 2026, label: 'Year' }),
)
const accountFilter = defineDashboardFilter((p) =>
  p.remote(
    { load: () => Promise.resolve({ hasMore: false, options: [] }) },
    { label: 'Account', placeholder: 'All accounts' },
  ),
)
const accountsFilter = defineDashboardFilter((p) =>
  p.remote({ load: () => Promise.resolve({ hasMore: false, options: [] }) }, { multiple: true }),
)
const periodFilters = defineDashboardFilters({
  year: yearFilter,
  months: (p) => p.enum([1, 2, 3], { columns: 3, multiple: true }),
})

const consumptionView = defineDashboardView({
  label: 'Consumption',
  shared: periodFilters,
  params: (p, { params }) => {
    expectTypeOf(params.year).toEqualTypeOf<2024 | 2025 | 2026>()
    return {
      account: accountFilter,
      compare: p.boolean({ defaultValue: true, format: (on) => (on ? `${params.year - 1}` : '—') }),
    }
  },
  queries: ({ background, essential, params }) => {
    expectTypeOf(params.year).toEqualTypeOf<2024 | 2025 | 2026>()
    expectTypeOf(params.months).toEqualTypeOf<(1 | 2 | 3)[]>()
    expectTypeOf(params.account).toEqualTypeOf<string | undefined>()
    const overview = () => ({
      queryKey: ['overview', params.year, params.account],
      queryFn: () => api.overview({ account: params.account, year: params.year }),
    })
    const products = essential.query({ query: overview, select: (data) => data.products })
    return {
      summary: essential.query({ query: overview, select: (data) => data.summary }),
      months: essential.query({ defaultValue: [], query: overview, select: (data) => data.months }),
      products,
      usage: background.query({
        defaultValue: [],
        params: {
          tracked: (p) =>
            p.options(
              () =>
                (products.data ?? []).map((product) => ({
                  label: product.name,
                  value: product.id,
                })),
              { max: 6, multiple: true },
            ),
          ids: (p) => p.string({ multiple: true }),
        },
        requires: () => (products.data?.length ? products.data : null),
        query: ({ params: widget, required }) => ({
          queryKey: ['usage', widget.tracked, required.length],
          queryFn: () => api.usage(widget.tracked),
        }),
      }),
    }
  },
  derive: ({ data }) => ({
    total: () => data.months.reduce((sum, row) => sum + row.units, 0),
  }),
})

const certificationsView = defineDashboardView({
  label: 'Certifications',
  shared: { year: yearFilter },
  params: { accounts: accountsFilter },
})

const adminDashboard = defineDashboardSchema({
  key: 'admin',
  params: periodFilters,
  views: { consumption: consumptionView, certifications: certificationsView },
})

type Admin = InferDashboard<typeof adminDashboard>
type Consumption = InferDashboardView<typeof consumptionView>

describe('standalone dashboard definitions', () => {
  it('infers filters declared on their own and in groups', () => {
    expectTypeOf<Admin['params']['year']>().toEqualTypeOf<2024 | 2025 | 2026>()
    expectTypeOf<Admin['params']['months']>().toEqualTypeOf<(1 | 2 | 3)[]>()
    expectTypeOf<Admin['filters']['year']>().toEqualTypeOf<
      DashboardFilterHandle<2024 | 2025 | 2026, 2024 | 2025 | 2026>
    >()
    expectTypeOf<Admin['certifications']['params']['accounts']>().toEqualTypeOf<string[]>()
  })

  it('merges shared params into view handles', () => {
    expectTypeOf<keyof Consumption['params']>().toEqualTypeOf<
      'year' | 'months' | 'account' | 'compare'
    >()
    expectTypeOf<Consumption['params']['compare']>().toEqualTypeOf<boolean>()
    expectTypeOf<Admin['consumption']['params']['account']>().toEqualTypeOf<string | undefined>()
    expectTypeOf<Admin['view']['current']>().toEqualTypeOf<'consumption' | 'certifications'>()
  })

  it('types resources split with select', () => {
    expectTypeOf<Consumption['summary']['data']>().toEqualTypeOf<
      { units: number; previous: number } | undefined
    >()
    expectTypeOf<Consumption['months']['data']>().toEqualTypeOf<
      { month: number; units: number }[]
    >()
    expectTypeOf<Consumption['total']['data']>().toEqualTypeOf<number>()
    expectTypeOf<Consumption['usage']['params']['tracked']>().toEqualTypeOf<string[]>()
    expectTypeOf<Consumption['usage']['params']['ids']>().toEqualTypeOf<string[]>()
    expectTypeOf<Consumption['usage']['filters']['tracked']['items']>().toEqualTypeOf<
      readonly DashboardOption<string>[]
    >()
  })

  it('returns typed handles from useDashboardView and useDashboard', () => {
    const mountView = () => useDashboardView(consumptionView)
    expectTypeOf<ReturnType<typeof mountView>>().toEqualTypeOf<Consumption>()
    const mountDashboard = () => useDashboard(adminDashboard)
    expectTypeOf<ReturnType<typeof mountDashboard>>().toEqualTypeOf<Admin>()
  })

  it('types default getters like static defaults', () => {
    const dashboard = defineDashboardSchema({
      key: 'getter-defaults',
      params: (p) => ({
        year: p.enum([2025, 2026], { defaultValue: () => latest.year }),
        latestYear: p.enum([2025, 2026], { defaultValue: () => 2026 }),
        ids: p.string({ defaultValue: () => latest.ids, multiple: true }),
        languages: p.enum(['en', 'fr'], { defaultValue: () => ['en'], multiple: true }),
        // Read from data that may not be loaded yet: `undefined` stays in the type.
        first: p.options(() => [], { defaultValue: () => loaded.products?.[0]?.id }),
        compare: p.comparison({ defaultValue: () => 'year' }),
        // @ts-expect-error the default getter returns a value outside the list
        month: p.enum([1, 2, 3], { defaultValue: () => latest.year }),
        // @ts-expect-error a single param cannot default to a list
        language: p.enum(['en', 'fr'], { defaultValue: () => ['en'] }),
      }),
    })
    type Getters = InferDashboard<typeof dashboard>['params']
    expectTypeOf<Getters['year']>().toEqualTypeOf<2025 | 2026>()
    expectTypeOf<Getters['latestYear']>().toEqualTypeOf<2025 | 2026>()
    expectTypeOf<Getters['ids']>().toEqualTypeOf<string[]>()
    expectTypeOf<Getters['languages']>().toEqualTypeOf<('en' | 'fr')[]>()
    expectTypeOf<Getters['first']>().toEqualTypeOf<string | undefined>()
    expectTypeOf<Getters['compare']>().toEqualTypeOf<'previous' | 'year' | 'none'>()
  })

  it('types presets getters on single and list params', () => {
    const dashboard = defineDashboardSchema({
      key: 'preset-getters',
      params: (p) => ({
        language: p.enum(['en', 'fr'], { presets: () => [{ label: 'English', value: 'en' }] }),
        languages: p.enum(['en', 'fr'], {
          multiple: true,
          presets: () => [{ label: 'Both', value: ['en', 'fr'] }],
        }),
      }),
    })
    type Presets = InferDashboard<typeof dashboard>['params']
    expectTypeOf<Presets['language']>().toEqualTypeOf<'en' | 'fr' | undefined>()
    expectTypeOf<Presets['languages']>().toEqualTypeOf<('en' | 'fr')[]>()
  })

  it('types sync sources against the param value', () => {
    const tenant = ref<string | undefined>()
    defineDashboardFilter((p) => p.string({ sync: tenant }))
    defineDashboardFilter((p) => p.number({ sync: () => 3 }))
    // @ts-expect-error a string store cannot back a number param
    defineDashboardFilter((p) => p.number({ sync: tenant }))
  })

  it('checks default values against selected data', () => {
    defineDashboardView({
      // @ts-expect-error the default is not a list of months
      queries: ({ essential }) => ({
        months: essential.query({
          defaultValue: 'none',
          query: () => ({ queryKey: ['x'], queryFn: () => api.overview({ year: 2026 }) }),
          select: (data) => data.months,
        }),
      }),
    })
  })

  it('rejects views whose shared params the root declares with another type', () => {
    const other = defineDashboardView({ shared: { year: (p) => p.string() } })
    defineDashboardSchema({
      key: 'mismatch',
      params: periodFilters,
      // @ts-expect-error the root `year` is not a string
      views: { other },
    })
  })
})
