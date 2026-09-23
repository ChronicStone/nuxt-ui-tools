import { describe, expect, it, vi } from 'vitest'

import { defineDashboardSchema, defineDashboardView } from '#ui-tools/dashboard'

import { deferredSource, mountDashboard } from './harness'

describe('dashboard staging', () => {
  it('fetches essentials first, background after they settle, deferred on activation', async () => {
    const summary = deferredSource<{ total: number }>()
    const trend = deferredSource<number[]>()
    const table = deferredSource<string[]>()
    const schema = defineDashboardSchema({
      key: 'staging',
      queries: ({ background, deferred, essential }) => ({
        summary: essential.query(() => ({ queryFn: summary.fn, queryKey: ['summary'] })),
        table: deferred.query({
          defaultValue: [],
          query: () => ({ queryFn: table.fn, queryKey: ['table'] }),
        }),
        trend: background.query(() => ({ queryFn: trend.fn, queryKey: ['trend'] })),
      }),
    })

    const { dashboard, flush } = await mountDashboard({ schema })

    expect(summary.calls).toHaveLength(1)
    expect(trend.calls).toHaveLength(0)
    expect(dashboard.summary.state).toBe('loading')
    expect(dashboard.trend.state).toBe('idle')
    expect(dashboard.table.state).toBe('idle')
    expect(dashboard.table.data).toEqual([])
    expect(dashboard.state).toBe('loading')

    summary.calls[0]?.reject(new Error('boom'))
    await flush()
    expect(dashboard.summary.state).toBe('error')
    expect(dashboard.state).toBe('error')
    expect(trend.calls).toHaveLength(1)
    expect(table.calls).toHaveLength(0)

    dashboard.table.activate()
    await flush()
    expect(table.calls).toHaveLength(1)
    table.calls[0]?.resolve(['a'])
    await flush()
    expect(dashboard.table.state).toBe('ready')
    expect(dashboard.table.data).toEqual(['a'])
  })

  it('gates dependent queries with requires and narrows the required value', async () => {
    const detail = deferredSource<{ spend: number }>()
    const schema = defineDashboardSchema({
      key: 'requires',
      filters: (f) => ({ account: f.string() }),
      queries: ({ essential, filters }) => ({
        detail: essential.query({
          query: ({ required }) => ({
            queryFn: () => detail.fn(required),
            queryKey: ['detail', required],
          }),
          requires: () => filters.account,
        }),
      }),
    })

    const { dashboard, flush, query } = await mountDashboard({ schema })
    expect(dashboard.detail.state).toBe('idle')
    expect(dashboard.state).toBe('ready')
    expect(detail.calls).toHaveLength(0)

    dashboard.filters.account = 'acme'
    await flush()
    expect(query()).toEqual({ account: 'acme' })
    expect(detail.calls).toHaveLength(1)
    expect(detail.calls[0]?.args).toEqual(['acme'])
  })
})

type ViewSources = {
  usage: ReturnType<typeof deferredSource<number[]>>
  funnel: ReturnType<typeof deferredSource<number[]>>
}

function usageView(sources: ViewSources) {
  return defineDashboardView({
    label: 'Usage',
    filters: (f) => ({
      year: f.enum([2025, 2026], { defaultValue: 2026 }),
      currency: f.enum(['EUR', 'USD'], { defaultValue: 'EUR' }),
    }),
    queries: ({ essential, filters }) => ({
      lines: essential.query({
        defaultValue: [],
        filters: (f) => ({
          tracked: f.enum(['a', 'b', 'c'], { defaultValue: ['a'], multiple: true }),
        }),
        query: ({ filters: own }) => ({
          queryFn: () => sources.usage.fn(filters.year, filters.currency, own.tracked),
          queryKey: ['usage', filters.year, filters.currency, own.tracked],
        }),
      }),
    }),
    derive: ({ data }) => ({
      total: () => data.lines.reduce((sum, value) => sum + value, 0),
    }),
  })
}

function funnelView(sources: ViewSources) {
  return defineDashboardView({
    label: () => 'Funnel',
    filters: (f) => ({ year: f.enum([2025, 2026], { defaultValue: 2026 }) }),
    queries: ({ essential, filters }) => ({
      steps: essential.query(() => ({
        queryFn: () => sources.funnel.fn(filters.year),
        queryKey: ['funnel', filters.year],
      })),
    }),
  })
}

function createViewsSchema(sources: ViewSources) {
  return defineDashboardSchema({
    key: 'views',
    views: { usage: usageView(sources), funnel: funnelView(sources) },
  })
}

describe('dashboard views', () => {
  it('keeps inactive views idle and keeps opened views warm', async () => {
    const usage = deferredSource<number[]>()
    const funnel = deferredSource<number[]>()
    const { dashboard, flush, query } = await mountDashboard({
      schema: createViewsSchema({ funnel, usage }),
    })

    expect(dashboard.view.current).toBe('usage')
    expect(dashboard.view.items).toEqual([
      { label: 'Usage', value: 'usage' },
      { label: 'Funnel', value: 'funnel' },
    ])
    expect(usage.calls).toHaveLength(1)
    expect(funnel.calls).toHaveLength(0)
    expect(dashboard.funnel.state).toBe('idle')
    expect(dashboard.funnel.view.opened).toBe(false)

    dashboard.view.current = 'funnel'
    await flush()
    expect(query()).toEqual({ view: 'funnel' })
    expect(funnel.calls).toHaveLength(1)
    expect(dashboard.funnel.view.active).toBe(true)

    dashboard.view.current = 'usage'
    await flush()
    expect(usage.calls).toHaveLength(1)
    expect(dashboard.usage.view.opened).toBe(true)
  })

  it('opens the view selected in the URL and restores its filters', async () => {
    const usage = deferredSource<number[]>()
    const funnel = deferredSource<number[]>()
    const { dashboard } = await mountDashboard({
      query: { currency: 'USD', 'lines.tracked': 'b,c', view: 'funnel', year: '2025' },
      schema: createViewsSchema({ funnel, usage }),
    })

    expect(usage.calls).toHaveLength(0)
    expect(funnel.calls).toHaveLength(1)
    expect(funnel.calls[0]?.args).toEqual([2025])
    expect(dashboard.funnel.filters.year).toBe(2025)
    expect(dashboard.usage.filters.year).toBe(2025)
    expect(dashboard.usage.filters.currency).toBe('USD')
    expect(dashboard.usage.lines.filters.tracked).toEqual(['b', 'c'])
  })

  it('rejects a filter that would shadow the current-view URL key', async () => {
    const schema = defineDashboardSchema({
      key: 'shadowed',
      views: {
        main: defineDashboardView({ label: 'Main', filters: (f) => ({ view: f.string() }) }),
      },
    })
    await expect(mountDashboard({ schema })).rejects.toThrow(/view "main" uses the URL key "view"/u)
  })

  it('writes filters under their own keys, one value per key across views, and omits defaults', async () => {
    const usage = deferredSource<number[]>()
    const funnel = deferredSource<number[]>()
    const { dashboard, flush, query } = await mountDashboard({
      schema: createViewsSchema({ funnel, usage }),
    })

    dashboard.usage.filters.currency = 'USD'
    dashboard.usage.lines.filters.tracked = ['a', 'c']
    await flush()
    expect(query()).toEqual({ currency: 'USD', 'lines.tracked': 'a,c' })
    expect(usage.calls.at(-1)?.args).toEqual([2026, 'USD', ['a', 'c']])

    dashboard.usage.filters.currency = 'EUR'
    dashboard.usage.filters.year = 2025
    await flush()
    expect(query()).toEqual({ 'lines.tracked': 'a,c', year: '2025' })
    // Both views declare `year`: it is one filter.
    expect(dashboard.funnel.filters.year).toBe(2025)
  })

  it('rejects two views declaring one filter key differently', async () => {
    const schema = defineDashboardSchema({
      key: 'mismatch',
      views: {
        first: defineDashboardView({
          filters: (f) => ({ status: f.enum(['open', 'closed'], { defaultValue: 'open' }) }),
        }),
        second: defineDashboardView({ filters: (f) => ({ status: f.string() }) }),
      },
    })
    await expect(mountDashboard({ schema })).rejects.toThrow(
      /share the URL key "status", so they share one value, but they are declared differently/u,
    )
  })

  it('derives values whose state follows the queries they read', async () => {
    const usage = deferredSource<number[]>()
    const funnel = deferredSource<number[]>()
    const { dashboard, flush } = await mountDashboard({
      schema: createViewsSchema({ funnel, usage }),
    })

    expect(dashboard.usage.total.state).toBe('loading')
    usage.calls[0]?.resolve([2, 3])
    await flush()
    expect(dashboard.usage.total.state).toBe('ready')
    expect(dashboard.usage.total.data).toBe(5)

    dashboard.usage.filters.currency = 'USD'
    await flush()
    expect(dashboard.usage.lines.state).toBe('ready')
    expect(dashboard.usage.lines.refreshing).toBe(true)
    expect(dashboard.usage.total.refreshing).toBe(true)
    usage.calls.at(-1)?.resolve([10])
    await flush()
    expect(dashboard.usage.total.data).toBe(10)
    expect(dashboard.usage.total.refreshing).toBe(false)
  })

  it('refreshes every active query of opened scopes', async () => {
    const usage = deferredSource<number[]>()
    const funnel = deferredSource<number[]>()
    const { dashboard, flush } = await mountDashboard({
      schema: createViewsSchema({ funnel, usage }),
    })
    usage.calls[0]?.resolve([1])
    await flush()

    const refreshed = dashboard.refresh()
    expect(dashboard.refreshing).toBe(true)
    await flush()
    expect(usage.calls).toHaveLength(2)
    expect(funnel.calls).toHaveLength(0)
    usage.calls[1]?.resolve([2])
    await refreshed
    await flush()
    expect(dashboard.refreshing).toBe(false)
  })

  it('reports when the data on screen was last fetched', async () => {
    vi.useFakeTimers({ now: 1_000_000, toFake: ['Date'] })
    try {
      const usage = deferredSource<number[]>()
      const funnel = deferredSource<number[]>()
      const { dashboard, flush } = await mountDashboard({
        schema: createViewsSchema({ funnel, usage }),
      })
      expect(dashboard.usage.lines.updatedAt).toBeUndefined()
      expect(dashboard.updatedAt).toBeUndefined()

      usage.calls[0]?.resolve([1])
      await flush()
      expect(dashboard.usage.lines.updatedAt).toBe(1_000_000)
      // A derived value is as fresh as its oldest input.
      expect(dashboard.usage.total.updatedAt).toBe(1_000_000)
      expect(dashboard.usage.updatedAt).toBe(1_000_000)
      expect(dashboard.updatedAt).toBe(1_000_000)

      vi.setSystemTime(1_060_000)
      dashboard.view.current = 'funnel'
      await flush()
      funnel.calls[0]?.resolve([3])
      await flush()
      expect(dashboard.funnel.steps.updatedAt).toBe(1_060_000)
      // On screen: the root (no queries) and the funnel view.
      expect(dashboard.updatedAt).toBe(1_060_000)
    } finally {
      vi.useRealTimers()
    }
  })
})

function createLiveSchema(summary: ReturnType<typeof deferredSource<number>>) {
  return defineDashboardSchema({
    autoRefresh: 60,
    key: 'live',
    queries: ({ essential }) => ({
      summary: essential.query(() => ({ queryFn: summary.fn, queryKey: ['summary'] })),
    }),
  })
}

describe('dashboard auto-refresh', () => {
  it('starts from the URL or the schema default and polls every active query', async () => {
    const summary = deferredSource<number>()
    const { dashboard, flush, query, queryClient } = await mountDashboard({
      query: { refresh: '30' },
      schema: createLiveSchema(summary),
    })
    const interval = () =>
      queryClient.getQueryCache().find({ queryKey: ['summary'] })?.observers[0]?.options
        .refetchInterval

    expect(dashboard.autoRefresh).toBe(30)
    expect(interval()).toBe(30_000)

    dashboard.autoRefresh = 0
    await flush()
    expect(query()).toEqual({ refresh: '0' })
    expect(interval()).toBe(false)

    // Back to the schema default: the URL key goes away.
    dashboard.autoRefresh = 60
    await flush()
    expect(query()).toEqual({})
    expect(interval()).toBe(60_000)
  })

  it('rejects a filter that would shadow the auto-refresh URL key', async () => {
    const schema = defineDashboardSchema({
      key: 'shadowed-refresh',
      filters: (f) => ({ refresh: f.boolean() }),
    })
    await expect(mountDashboard({ schema })).rejects.toThrow(/uses the URL key "refresh"/u)
  })
})

describe('dashboard comparison filter', () => {
  it('offers localized comparison modes, typed and URL-synced', async () => {
    const schema = defineDashboardSchema({
      key: 'compare',
      filters: (f) => ({ compare: f.comparison({ defaultValue: 'previous' }) }),
    })
    const { dashboard, flush, query } = await mountDashboard({ schema })

    expect(dashboard.filters.compare).toBe('previous')
    expect(dashboard.controls.compare.items.map((item) => [item.value, item.label])).toEqual([
      ['previous', 'Période précédente'],
      ['year', 'Année précédente'],
      ['none', 'Sans comparaison'],
    ])
    dashboard.filters.compare = 'none'
    await flush()
    expect(query()).toEqual({ compare: 'none' })
    expect(dashboard.controls.compare.selected.map((item) => item.label)).toEqual([
      'Sans comparaison',
    ])
  })
})

describe('dashboard option controls', () => {
  it('exposes static option items and the selected option', async () => {
    const schema = defineDashboardSchema({
      key: 'static-options',
      filters: (f) => ({
        currency: f.options(
          [
            { icon: 'i-lucide-euro', label: 'Euro', value: 'EUR' },
            { icon: 'i-lucide-dollar-sign', label: 'Dollar', value: 'USD' },
          ],
          { defaultValue: 'EUR' },
        ),
      }),
    })
    const { dashboard, flush } = await mountDashboard({ schema })

    expect(dashboard.controls.currency.items.map((item) => item.value)).toEqual(['EUR', 'USD'])
    expect(dashboard.controls.currency.selected.map((item) => item.label)).toEqual(['Euro'])
    dashboard.filters.currency = 'USD'
    await flush()
    expect(dashboard.controls.currency.selected.map((item) => item.label)).toEqual(['Dollar'])
  })

  it('loads remote options on open and hydrates selected values from the URL', async () => {
    const pages = deferredSource<{
      options: { value: string; label: string }[]
      hasMore: boolean
    }>()
    const selected = deferredSource<{ value: string; label: string }[]>()
    const schema = defineDashboardSchema({
      key: 'remote-options',
      filters: (f) => ({
        accounts: f.remote({
          load: (request) => pages.fn(request),
          multiple: true,
          pagination: { size: 2, type: 'page' },
          resolveSelected: (request) => selected.fn(request),
        }),
      }),
    })
    const { dashboard, flush } = await mountDashboard({
      query: { accounts: 'acme,globex' },
      schema,
    })

    expect(pages.calls).toHaveLength(0)
    expect(selected.calls[0]?.args).toEqual([{ values: ['acme', 'globex'] }])
    selected.calls[0]?.resolve([
      { label: 'Acme', value: 'acme' },
      { label: 'Globex', value: 'globex' },
    ])
    await flush()
    expect(dashboard.controls.accounts.selected.map((option) => option.label)).toEqual([
      'Acme',
      'Globex',
    ])

    dashboard.controls.accounts.open = true
    await flush()
    expect(pages.calls[0]?.args).toEqual([
      { page: { cursor: null, index: 1, size: 2 }, search: '' },
    ])
    pages.calls[0]?.resolve({ hasMore: true, options: [{ label: 'Initech', value: 'initech' }] })
    await flush()
    expect(dashboard.controls.accounts.hasMore).toBe(true)
    expect(dashboard.controls.accounts.items.map((option) => option.value)).toEqual([
      'initech',
      'acme',
      'globex',
    ])

    dashboard.controls.accounts.loadMore()
    await flush()
    expect(pages.calls[1]?.args).toEqual([
      { page: { cursor: null, index: 2, size: 2 }, search: '' },
    ])
  })
})
