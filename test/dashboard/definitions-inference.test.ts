import { describe, expectTypeOf, it } from 'vitest'
import { ref } from 'vue'

import {
  defineDashboardSchema,
  defineDashboardView,
  injectDashboard,
  useDashboard,
  useDashboardView,
} from '#ui-tools/dashboard'
import type {
  DashboardFilterControl,
  DashboardOption,
  InferDashboard,
  InferDashboardView,
} from '#ui-tools/dashboard'

interface Overview {
  summary: { units: number; previous: number }
  months: { month: number; units: number }[]
  products: { id: string; name: string }[]
}

type Workspace = 'ADMIN' | 'CLIENT'

/** Data the getter defaults read, as a loaded query would expose it. */
declare const latest: { year: 2025 | 2026; ids: string[] }
declare const loaded: { products?: { id: string }[] }

declare const api: {
  overview: (input: { year: number; account?: string }) => Promise<Overview>
  usage: (ids: string[]) => Promise<{ month: number; units: Record<string, number> }[]>
}

function consumptionView(params: { workspace: Workspace }) {
  return defineDashboardView({
    label: 'Consumption',
    enabled: () => params.workspace === 'ADMIN',
    filters: (f) => {
      const year = f.enum([2024, 2025, 2026], { defaultValue: 2026, label: 'Year' })
      expectTypeOf(year.value).toEqualTypeOf<2024 | 2025 | 2026>()
      return {
        year,
        months: f.enum([1, 2, 3], { columns: 3, multiple: true }),
        account: f.remote(
          { load: () => Promise.resolve({ hasMore: false, options: [] }) },
          {
            enabled: () => params.workspace === 'ADMIN',
            label: 'Account',
            placeholder: 'All accounts',
          },
        ),
        compare: f.boolean({
          defaultValue: true,
          format: (on) => (on ? `${year.value - 1}` : '—'),
        }),
      }
    },
    queries: ({ background, essential, filters }) => {
      expectTypeOf(filters.year).toEqualTypeOf<2024 | 2025 | 2026>()
      expectTypeOf(filters.months).toEqualTypeOf<(1 | 2 | 3)[]>()
      expectTypeOf(filters.account).toEqualTypeOf<string | undefined>()
      const overview = () => ({
        queryKey: ['overview', filters.year, filters.account],
        queryFn: () => api.overview({ account: filters.account, year: filters.year }),
      })
      const products = essential.query({ query: overview, select: (data) => data.products })
      return {
        summary: essential.query({ query: overview, select: (data) => data.summary }),
        months: essential.query({
          defaultValue: [],
          query: overview,
          select: (data) => data.months,
        }),
        products,
        usage: background.query({
          defaultValue: [],
          filters: (f) => ({
            tracked: f.options(
              () =>
                (products.data ?? []).map((product) => ({
                  label: product.name,
                  value: product.id,
                })),
              { max: 6, multiple: true },
            ),
            ids: f.string({ multiple: true }),
          }),
          requires: () => (products.data?.length ? products.data : null),
          query: ({ filters: own, required }) => ({
            queryKey: ['usage', own.tracked, required.length],
            queryFn: () => api.usage(own.tracked),
          }),
        }),
      }
    },
    derive: ({ data }) => ({
      total: () => data.months.reduce((sum, row) => sum + row.units, 0),
    }),
  })
}

function certificationsView() {
  return defineDashboardView({
    label: 'Certifications',
    filters: (f) => ({
      year: f.enum([2024, 2025, 2026], { defaultValue: 2026, label: 'Year' }),
      accounts: f.remote(
        { load: () => Promise.resolve({ hasMore: false, options: [] }) },
        { multiple: true },
      ),
    }),
  })
}

function adminSchema(params: { workspace: Workspace }) {
  return defineDashboardSchema({
    key: 'admin',
    views: { consumption: consumptionView(params), certifications: certificationsView() },
  })
}

type Admin = InferDashboard<typeof adminSchema>
type Consumption = InferDashboardView<typeof consumptionView>

describe('dashboards composed from functions', () => {
  it('types a dashboard and its views from their functions', () => {
    expectTypeOf<Admin['view']['current']>().toEqualTypeOf<'consumption' | 'certifications'>()
    expectTypeOf<Admin['consumption']['filters']['year']>().toEqualTypeOf<2024 | 2025 | 2026>()
    expectTypeOf<Admin['certifications']['filters']['accounts']>().toEqualTypeOf<string[]>()
    expectTypeOf<Admin['consumption']['controls']['year']>().toEqualTypeOf<
      DashboardFilterControl<2024 | 2025 | 2026, 2024 | 2025 | 2026>
    >()
    expectTypeOf<keyof Consumption['filters']>().toEqualTypeOf<
      'year' | 'months' | 'account' | 'compare'
    >()
    expectTypeOf<Consumption['filters']['compare']>().toEqualTypeOf<boolean>()
  })

  it('types resources split with select, and query filters', () => {
    expectTypeOf<Consumption['summary']['data']>().toEqualTypeOf<
      { units: number; previous: number } | undefined
    >()
    expectTypeOf<Consumption['months']['data']>().toEqualTypeOf<
      { month: number; units: number }[]
    >()
    expectTypeOf<Consumption['total']['data']>().toEqualTypeOf<number>()
    expectTypeOf<Consumption['usage']['filters']['tracked']>().toEqualTypeOf<string[]>()
    expectTypeOf<Consumption['usage']['filters']['ids']>().toEqualTypeOf<string[]>()
    expectTypeOf<Consumption['usage']['controls']['tracked']['items']>().toEqualTypeOf<
      readonly DashboardOption<string>[]
    >()
  })

  it('returns typed handles from useDashboard, injectDashboard and useDashboardView', () => {
    const mountDashboard = () => useDashboard(() => adminSchema({ workspace: 'ADMIN' }))
    expectTypeOf<ReturnType<typeof mountDashboard>>().toEqualTypeOf<Admin>()
    const mountInjected = () => injectDashboard(adminSchema)
    expectTypeOf<ReturnType<typeof mountInjected>>().toEqualTypeOf<Admin>()
    const mountView = () => useDashboardView(consumptionView)
    expectTypeOf<ReturnType<typeof mountView>>().toEqualTypeOf<Consumption>()
    // The view a schema holds fits the type of its view function.
    expectTypeOf<Admin['consumption']>().toExtend<Consumption>()
  })

  it('takes conditions as lazy callbacks only', () => {
    defineDashboardView({ enabled: () => true })
    // @ts-expect-error `enabled` is a lazy callback
    defineDashboardView({ enabled: true })
    defineDashboardSchema({
      key: 'lazy',
      // @ts-expect-error `enabled` is a lazy callback
      filters: (f) => ({ account: f.string({ enabled: false }) }),
    })
  })

  it('types default getters like static defaults', () => {
    const dashboard = defineDashboardSchema({
      key: 'getter-defaults',
      filters: (f) => ({
        year: f.enum([2025, 2026], { defaultValue: () => latest.year }),
        latestYear: f.enum([2025, 2026], { defaultValue: () => 2026 }),
        ids: f.string({ defaultValue: () => latest.ids, multiple: true }),
        languages: f.enum(['en', 'fr'], { defaultValue: () => ['en'], multiple: true }),
        // Read from data that may not be loaded yet: `undefined` stays in the type.
        first: f.options(() => [], { defaultValue: () => loaded.products?.[0]?.id }),
        compare: f.comparison({ defaultValue: () => 'year' }),
        // @ts-expect-error the default getter returns a value outside the list
        month: f.enum([1, 2, 3], { defaultValue: () => latest.year }),
        // @ts-expect-error a single filter cannot default to a list
        language: f.enum(['en', 'fr'], { defaultValue: () => ['en'] }),
      }),
    })
    type Getters = InferDashboard<typeof dashboard>['filters']
    expectTypeOf<Getters['year']>().toEqualTypeOf<2025 | 2026>()
    expectTypeOf<Getters['latestYear']>().toEqualTypeOf<2025 | 2026>()
    expectTypeOf<Getters['ids']>().toEqualTypeOf<string[]>()
    expectTypeOf<Getters['languages']>().toEqualTypeOf<('en' | 'fr')[]>()
    expectTypeOf<Getters['first']>().toEqualTypeOf<string | undefined>()
    expectTypeOf<Getters['compare']>().toEqualTypeOf<'previous' | 'year' | 'none'>()
  })

  it('types presets getters on single and list filters', () => {
    const dashboard = defineDashboardSchema({
      key: 'preset-getters',
      filters: (f) => ({
        language: f.enum(['en', 'fr'], { presets: () => [{ label: 'English', value: 'en' }] }),
        languages: f.enum(['en', 'fr'], {
          multiple: true,
          presets: () => [{ label: 'Both', value: ['en', 'fr'] }],
        }),
      }),
    })
    type Presets = InferDashboard<typeof dashboard>['filters']
    expectTypeOf<Presets['language']>().toEqualTypeOf<'en' | 'fr' | undefined>()
    expectTypeOf<Presets['languages']>().toEqualTypeOf<('en' | 'fr')[]>()
  })

  it('types sync sources against the filter value', () => {
    const tenant = ref<string | undefined>()
    defineDashboardSchema({
      key: 'sync',
      filters: (f) => ({
        tenant: f.string({ sync: tenant }),
        count: f.number({ sync: () => 3 }),
        // @ts-expect-error a string store cannot back a number filter
        wrong: f.number({ sync: tenant }),
      }),
    })
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
})
