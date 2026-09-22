import { describe, expect, it } from 'vitest'
import { ref } from 'vue'

import { defineDashboardFilter, defineDashboardSchema } from '#ui-tools/dashboard'

import { deferredSource, mountDashboard } from './harness'

const MONTHS = [1, 2, 3, 4, 5, 6] as const

/** A read-only source, like a value read from the session. */
function readRole() {
  return 'admin'
}

describe('dashboard filter handles', () => {
  it('drives values, display text, and reset from the handle', async () => {
    const schema = defineDashboardSchema({
      key: 'handles',
      params: (p) => ({
        year: p.enum([2025, 2026], { defaultValue: 2026, label: 'Year' }),
        months: p.enum(MONTHS, {
          columns: 3,
          format: (month) => `M${month}`,
          label: () => 'Months',
          max: 3,
          multiple: true,
        }),
        compare: p.boolean({ defaultValue: true, format: (on) => (on ? 'Previous year' : 'None') }),
      }),
    })

    const { dashboard, flush, query } = await mountDashboard({ schema })
    const { compare, months, year } = dashboard.filters

    expect(year.label).toBe('Year')
    expect(year.display).toBe('2026')
    expect(year.changed).toBe(false)
    expect(months.label).toBe('Months')
    expect(months.display).toBe('Tous')
    expect(months.columns).toBe(3)
    expect(months.items.map((item) => item.label)).toEqual(['M1', 'M2', 'M3', 'M4', 'M5', 'M6'])
    expect(compare.items).toEqual([
      { label: 'Previous year', value: true },
      { label: 'None', value: false },
    ])

    months.toggle(4)
    months.toggle(2)
    await flush()
    expect(dashboard.params.months).toEqual([2, 4])
    expect(months.display).toBe('M2, M4')
    expect(query()).toEqual({ months: '2,4' })

    months.toggle(6)
    months.toggle(1)
    await flush()
    // Capped by `max`: the fourth value is ignored.
    expect(dashboard.params.months).toEqual([2, 4, 6])
    expect(months.display).toBe('M2 +2')
    expect(months.isSelected(4)).toBe(true)

    months.toggle(4)
    year.toggle(2025)
    compare.value = false
    await flush()
    expect(dashboard.params.months).toEqual([2, 6])
    expect(dashboard.filtered).toBe(true)
    expect(year.changed).toBe(true)
    expect(compare.display).toBe('None')

    dashboard.resetFilters()
    await flush()
    expect(dashboard.params).toEqual({ compare: true, months: [], year: 2026 })
    expect(dashboard.filtered).toBe(false)
    expect(query()).toEqual({})
  })

  it('keeps memory, store-synced, and headless params out of the URL and the reset', async () => {
    const tenant = ref<string | undefined>('acme')
    const schema = defineDashboardSchema({
      key: 'sync',
      params: (p) => ({
        tenant: p.string({ headless: true, sync: tenant }),
        role: p.string({ sync: readRole }),
        draft: p.string({ defaultValue: '', sync: 'memory' }),
        search: p.string(),
      }),
    })

    const { dashboard, flush, query } = await mountDashboard({ schema })
    expect(dashboard.params.tenant).toBe('acme')
    expect(dashboard.params.role).toBe('admin')
    expect(dashboard.filters.tenant.headless).toBe(true)

    tenant.value = 'globex'
    dashboard.params.draft = 'note'
    dashboard.params.role = 'viewer'
    dashboard.params.search = 'abc'
    await flush()
    expect(dashboard.params.tenant).toBe('globex')
    expect(dashboard.params.draft).toBe('note')
    // A getter source is read-only.
    expect(dashboard.params.role).toBe('admin')
    expect(query()).toEqual({ search: 'abc' })

    dashboard.params.tenant = 'initech'
    expect(tenant.value).toBe('initech')

    dashboard.resetFilters()
    await flush()
    expect(dashboard.params.search).toBeUndefined()
    expect(dashboard.params.draft).toBe('')
    // Headless params are left alone.
    expect(tenant.value).toBe('initech')
    expect(dashboard.filtered).toBe(false)
  })

  it('follows a default read from data and keeps it out of the URL', async () => {
    const products = deferredSource<{ id: string; units: number }[]>()
    const schema = defineDashboardSchema({
      key: 'dynamic-default',
      queries: ({ essential }) => {
        const catalog = essential.query({
          defaultValue: [],
          query: () => ({ queryFn: products.fn, queryKey: ['catalog'] }),
        })
        return {
          catalog,
          usage: essential.query({
            defaultValue: [],
            params: {
              tracked: (p) =>
                p.options(
                  () => catalog.data.map((product) => ({ label: product.id, value: product.id })),
                  {
                    defaultValue: () => catalog.data.slice(0, 2).map((product) => product.id),
                    multiple: true,
                  },
                ),
            },
            query: ({ params }) => ({
              queryFn: () => Promise.resolve(params.tracked),
              queryKey: ['usage', params.tracked],
            }),
          }),
        }
      },
    })

    const { dashboard, flush, query, until } = await mountDashboard({ schema })
    const { tracked } = dashboard.usage.filters
    await until(() => products.calls.length > 0)
    products.calls[0]?.resolve([
      { id: 'p1', units: 9 },
      { id: 'p2', units: 7 },
      { id: 'p3', units: 5 },
    ])
    await flush()
    expect(dashboard.usage.params.tracked).toEqual(['p1', 'p2'])
    expect(tracked.isSelected('p2')).toBe(true)
    expect(tracked.changed).toBe(false)

    tracked.toggle('p3')
    await flush()
    expect(dashboard.usage.params.tracked).toEqual(['p1', 'p2', 'p3'])
    expect(query()).toEqual({ 'usage.tracked': 'p1,p2,p3' })
    expect(tracked.changed).toBe(true)

    tracked.toggle('p3')
    await flush()
    // Back to the default: it leaves the URL and follows the data again.
    expect(query()).toEqual({})
    expect(tracked.changed).toBe(false)
  })

  it('offers presets that set the whole value and know when they are active', async () => {
    const schema = defineDashboardSchema({
      key: 'presets',
      params: (p) => ({
        months: p.enum(MONTHS, {
          multiple: true,
          presets: [
            { label: 'First quarter', value: [1, 2, 3] },
            { hint: '3 months', label: () => 'Second quarter', value: [4, 5, 6] },
          ],
        }),
      }),
    })

    const { dashboard, flush } = await mountDashboard({ schema })
    const { months } = dashboard.filters
    expect(months.presets.map((preset) => [preset.label, preset.active])).toEqual([
      ['First quarter', false],
      ['Second quarter', false],
    ])

    months.presets[1]?.apply()
    await flush()
    expect(dashboard.params.months).toEqual([4, 5, 6])
    expect(months.presets.map((preset) => preset.active)).toEqual([false, true])
    expect(months.presets[1]?.hint).toBe('3 months')
  })

  it('resolves filter factories, map params, and the shared-params context', async () => {
    const yearFilter = defineDashboardFilter((p) =>
      p.enum([2025, 2026], { defaultValue: 2026, label: 'Year' }),
    )
    const schema = defineDashboardSchema({
      key: 'factories',
      params: { year: yearFilter },
      views: (view) => ({
        usage: view({
          params: (p, { params }) => ({
            compare: p.boolean({
              defaultValue: true,
              format: (on) => (on ? String(params.year - 1) : 'None'),
            }),
          }),
        }),
      }),
    })

    const { dashboard, flush } = await mountDashboard({ schema })
    expect(dashboard.filters.year.label).toBe('Year')
    expect(dashboard.usage.filters.compare.display).toBe('2025')
    expect(Object.keys(dashboard.usage.filters)).toEqual(['year', 'compare'])

    dashboard.usage.params.year = 2025
    await flush()
    expect(dashboard.params.year).toBe(2025)
    expect(dashboard.usage.filters.compare.display).toBe('2024')
  })

  it('reads option items from data and loads remote options from query definitions', async () => {
    const accounts = deferredSource<{ rows: { id: string; name: string }[]; next: string | null }>()
    const names = deferredSource<{ id: string; name: string }[]>()
    const schema = defineDashboardSchema({
      key: 'options',
      params: (p) => ({
        account: p.remote(
          {
            load: ({ page, search }) => ({
              queryFn: () =>
                accounts.fn(search, page.cursor).then((result) => ({
                  nextCursor: result.next,
                  options: result.rows.map((row) => ({ label: row.name, value: row.id })),
                })),
              queryKey: ['accounts', search, page.cursor],
            }),
            pagination: { size: 2, type: 'cursor' },
            resolveSelected: ({ values }) =>
              names
                .fn(values)
                .then((rows) => rows.map((row) => ({ label: row.name, value: row.id }))),
          },
          { label: 'Account', placeholder: 'All accounts' },
        ),
      }),
      queries: ({ essential }) => {
        const products = essential.query({
          defaultValue: [],
          query: () => ({
            queryFn: () => Promise.resolve([{ id: 'p1', name: 'English' }]),
            queryKey: ['products'],
          }),
        })
        return {
          products,
          usage: essential.query({
            defaultValue: [],
            params: (p) => ({
              tracked: p.options(
                () => products.data.map((product) => ({ label: product.name, value: product.id })),
                { multiple: true },
              ),
            }),
            query: ({ params }) => ({
              queryFn: () => Promise.resolve(params.tracked),
              queryKey: ['usage', params.tracked],
            }),
          }),
        }
      },
    })

    const { dashboard, flush, until } = await mountDashboard({
      query: { account: 'a9', 'usage.tracked': 'p1' },
      schema,
    })
    const account = dashboard.filters.account

    await until(() => names.calls.length > 0)
    expect(account.display).toBe('…')
    names.calls[0]?.resolve([{ id: 'a9', name: 'Zeta' }])
    await flush()
    expect(account.display).toBe('Zeta')
    expect(account.searchable).toBe(true)

    account.open = true
    await until(() => accounts.calls.length > 0)
    accounts.calls[0]?.resolve({
      next: 'c2',
      rows: [
        { id: 'a1', name: 'Acme' },
        { id: 'a2', name: 'Globex' },
      ],
    })
    await flush()
    expect(account.items.map((item) => item.label)).toEqual(['Acme', 'Globex', 'Zeta'])
    expect(account.hasMore).toBe(true)

    await until(() => dashboard.products.state === 'ready')
    expect(dashboard.usage.filters.tracked.items).toEqual([{ label: 'English', value: 'p1' }])
    expect(dashboard.usage.filters.tracked.display).toBe('English')

    account.reset()
    await flush()
    expect(account.display).toBe('All accounts')
  })
})
