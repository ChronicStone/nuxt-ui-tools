import { queryOptions } from '@tanstack/vue-query'
import { describe, expect, it } from 'vitest'
import { ref } from 'vue'

import { defineDashboardSchema } from '#ui-tools/dashboard'
import { defineRemoteOptions } from '#ui-tools/shared'
import { remoteTableOptions } from '#ui-tools/table'

import { deferredSource, mountDashboard } from './harness'

const MONTHS = [1, 2, 3, 4, 5, 6] as const

/** A read-only source, like a value read from the session. */
function readRole() {
  return 'admin'
}

describe('dashboard filter controls', () => {
  it('refreshes selected labels when only the selected endpoint scope changes', async () => {
    const locale = ref('en')
    const users = defineRemoteOptions(
      {
        load: ({ page, search }) =>
          queryOptions({
            queryFn: () =>
              Promise.resolve({
                nextCursor: null,
                rows: [{ id: 'u1', name: 'User' }].filter(() => false),
              }),
            queryKey: ['users', 'list', search, page.cursor],
          }),
        resolveSelected: ({ values }) => {
          const currentLocale = locale.value
          return queryOptions({
            queryFn: () =>
              Promise.resolve({
                rows: values.map((id) => ({ id: String(id), name: `${currentLocale}-${id}` })),
              }),
            queryKey: ['users', 'selected', currentLocale, values],
          })
        },
      },
      {
        key: 'localized-users',
        mapPage: ({ nextCursor, rows }) => ({
          nextCursor,
          options: rows.map((user) => ({ label: user.name, value: user.id })),
        }),
        mapSelected: ({ rows }) => rows.map((user) => ({ label: user.name, value: user.id })),
        pagination: { size: 2, type: 'cursor' },
      },
    )
    const schema = defineDashboardSchema({
      filters: (f) => ({ owner: f.remote(users, { label: 'Owner' }) }),
      key: 'localized-users',
    })
    const { dashboard, fetchedKeys, until, wrapper } = await mountDashboard({
      query: { owner: 'u1' },
      schema,
    })
    await until(() => dashboard.controls.owner.display === 'en-u1')

    locale.value = 'fr'
    await until(() => dashboard.controls.owner.display === 'fr-u1')
    expect(fetchedKeys().some((key) => key.includes('"selected","fr"'))).toBe(true)
    wrapper.unmount()
  })

  it('updates table-backed options when an external workspace changes', async () => {
    const workspace = ref('first')
    const users = remoteTableOptions(
      (request) => {
        const scope = workspace.value
        return queryOptions({
          queryFn: () =>
            Promise.resolve({
              pageInfo: {
                count: 'none' as const,
                mode: 'cursor' as const,
                nextCursor: null,
                pageSize: request.pagination?.pageSize ?? 25,
                rowCount: null,
              },
              rows: [{ id: scope, name: scope }],
            }),
          queryKey: ['users', scope, request],
        })
      },
      { option: (user) => ({ label: user.name, value: user.id }) },
    )
    const schema = defineDashboardSchema({
      filters: (f) => ({ owner: f.remote(users, { label: 'Owner' }) }),
      key: 'table-backed-users',
    })
    const { dashboard, until, wrapper } = await mountDashboard({ schema })
    dashboard.controls.owner.open = true
    await until(() => dashboard.controls.owner.items[0]?.value === 'first')

    workspace.value = 'second'
    await until(() => dashboard.controls.owner.items[0]?.value === 'second')
    wrapper.unmount()
  })

  it('uses a reusable loader endpoint key when its scope changes', async () => {
    const workspace = ref('first')
    const users = defineRemoteOptions(
      {
        load: ({ search, page }) => {
          const scope = workspace.value
          return queryOptions({
            queryFn: () =>
              Promise.resolve({ rows: [{ id: scope, name: scope }], nextCursor: null }),
            queryKey: ['users', scope, search, page.cursor],
          })
        },
        resolveSelected: ({ values }) =>
          queryOptions({
            queryFn: () =>
              Promise.resolve({
                rows: values.map((value) => ({ id: String(value), name: String(value) })),
              }),
            queryKey: ['users', workspace.value, 'selected', values],
          }),
      },
      {
        key: 'users',
        mapPage: ({ nextCursor, rows }) => ({
          nextCursor,
          options: rows.map((user) => ({ label: user.name, value: user.id })),
        }),
        mapSelected: ({ rows }) => rows.map((user) => ({ label: user.name, value: user.id })),
        pagination: { size: 2, type: 'cursor' },
      },
    )
    const schema = defineDashboardSchema({
      filters: (f) => ({ owner: f.remote(users, { label: 'Owner' }) }),
      key: 'scoped-users',
    })
    const { dashboard, fetchedKeys, until, wrapper } = await mountDashboard({ schema })
    dashboard.controls.owner.open = true
    await until(() => dashboard.controls.owner.items[0]?.value === 'first')
    expect(fetchedKeys().some((key) => key.includes('"users","first"'))).toBe(true)

    workspace.value = 'second'
    await until(() => dashboard.controls.owner.items[0]?.value === 'second')
    expect(fetchedKeys().some((key) => key.includes('"users","second"'))).toBe(true)
    wrapper.unmount()
  })

  it('drives values, display text, and reset from the controls', async () => {
    const schema = defineDashboardSchema({
      key: 'handles',
      filters: (f) => ({
        year: f.enum([2025, 2026], { defaultValue: 2026, label: 'Year' }),
        months: f.enum(MONTHS, {
          columns: 3,
          format: (month) => `M${month}`,
          label: () => 'Months',
          max: 3,
          multiple: true,
        }),
        compare: f.boolean({ defaultValue: true, format: (on) => (on ? 'Previous year' : 'None') }),
      }),
    })

    const { dashboard, flush, query } = await mountDashboard({ schema })
    const { compare, months, year } = dashboard.controls

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
    expect(dashboard.filters.months).toEqual([2, 4])
    expect(months.display).toBe('M2, M4')
    expect(query()).toEqual({ months: '2,4' })

    months.toggle(6)
    months.toggle(1)
    await flush()
    // Capped by `max`: the fourth value is ignored.
    expect(dashboard.filters.months).toEqual([2, 4, 6])
    expect(months.display).toBe('M2 +2')
    expect(months.isSelected(4)).toBe(true)

    months.toggle(4)
    year.toggle(2025)
    compare.value = false
    await flush()
    expect(dashboard.filters.months).toEqual([2, 6])
    expect(dashboard.filtered).toBe(true)
    expect(year.changed).toBe(true)
    expect(compare.display).toBe('None')

    dashboard.resetFilters()
    await flush()
    expect(dashboard.filters).toEqual({ compare: true, months: [], year: 2026 })
    expect(dashboard.filtered).toBe(false)
    expect(query()).toEqual({})
  })

  it('keeps memory, store-synced, and headless filters out of the URL and the reset', async () => {
    const tenant = ref<string | undefined>('acme')
    const schema = defineDashboardSchema({
      key: 'sync',
      filters: (f) => ({
        tenant: f.string({ headless: true, sync: tenant }),
        role: f.string({ sync: readRole }),
        draft: f.string({ defaultValue: '', sync: 'memory' }),
        search: f.string(),
      }),
    })

    const { dashboard, flush, query } = await mountDashboard({ schema })
    expect(dashboard.filters.tenant).toBe('acme')
    expect(dashboard.filters.role).toBe('admin')
    expect(dashboard.controls.tenant.headless).toBe(true)

    tenant.value = 'globex'
    dashboard.filters.draft = 'note'
    dashboard.filters.role = 'viewer'
    dashboard.filters.search = 'abc'
    await flush()
    expect(dashboard.filters.tenant).toBe('globex')
    expect(dashboard.filters.draft).toBe('note')
    // A getter source is read-only.
    expect(dashboard.filters.role).toBe('admin')
    expect(query()).toEqual({ search: 'abc' })

    dashboard.filters.tenant = 'initech'
    expect(tenant.value).toBe('initech')

    dashboard.resetFilters()
    await flush()
    expect(dashboard.filters.search).toBeUndefined()
    expect(dashboard.filters.draft).toBe('')
    // Headless filters are left alone.
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
            filters: (f) => ({
              tracked: f.options(
                () => catalog.data.map((product) => ({ label: product.id, value: product.id })),
                {
                  defaultValue: () => catalog.data.slice(0, 2).map((product) => product.id),
                  multiple: true,
                },
              ),
            }),
            query: ({ filters }) => ({
              queryFn: () => Promise.resolve(filters.tracked),
              queryKey: ['usage', filters.tracked],
            }),
          }),
        }
      },
    })

    const { dashboard, flush, query, until } = await mountDashboard({ schema })
    const { tracked } = dashboard.usage.controls
    await until(() => products.calls.length > 0)
    products.calls[0]?.resolve([
      { id: 'p1', units: 9 },
      { id: 'p2', units: 7 },
      { id: 'p3', units: 5 },
    ])
    await flush()
    expect(dashboard.usage.filters.tracked).toEqual(['p1', 'p2'])
    expect(tracked.isSelected('p2')).toBe(true)
    expect(tracked.changed).toBe(false)

    tracked.toggle('p3')
    await flush()
    expect(dashboard.usage.filters.tracked).toEqual(['p1', 'p2', 'p3'])
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
      filters: (f) => ({
        months: f.enum(MONTHS, {
          multiple: true,
          presets: [
            { label: 'First quarter', value: [1, 2, 3] },
            { hint: '3 months', label: () => 'Second quarter', value: [4, 5, 6] },
          ],
        }),
      }),
    })

    const { dashboard, flush } = await mountDashboard({ schema })
    const { months } = dashboard.controls
    expect(months.presets.map((preset) => [preset.label, preset.active])).toEqual([
      ['First quarter', false],
      ['Second quarter', false],
    ])

    months.presets[1]?.apply()
    await flush()
    expect(dashboard.filters.months).toEqual([4, 5, 6])
    expect(months.presets.map((preset) => preset.active)).toEqual([false, true])
    expect(months.presets[1]?.hint).toBe('3 months')
  })

  it("reads another filter's current value through its definition", async () => {
    const schema = defineDashboardSchema({
      key: 'siblings',
      filters: (f) => {
        const year = f.enum([2025, 2026], { defaultValue: 2026, label: 'Year' })
        return {
          year,
          compare: f.boolean({
            defaultValue: true,
            format: (on) => (on ? String(year.value - 1) : 'None'),
          }),
        }
      },
    })

    const { dashboard, flush } = await mountDashboard({ schema })
    expect(dashboard.controls.year.label).toBe('Year')
    expect(dashboard.controls.compare.display).toBe('2025')
    expect(Object.keys(dashboard.controls)).toEqual(['year', 'compare'])

    dashboard.filters.year = 2025
    await flush()
    expect(dashboard.controls.compare.display).toBe('2024')
  })

  it('reads option items from data and loads remote options from query definitions', async () => {
    const accounts = deferredSource<{ rows: { id: string; name: string }[]; next: string | null }>()
    const names = deferredSource<{ id: string; name: string }[]>()
    const schema = defineDashboardSchema({
      key: 'options',
      filters: (f) => ({
        account: f.remote(
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
            filters: (f) => ({
              tracked: f.options(
                () => products.data.map((product) => ({ label: product.name, value: product.id })),
                { multiple: true },
              ),
            }),
            query: ({ filters }) => ({
              queryFn: () => Promise.resolve(filters.tracked),
              queryKey: ['usage', filters.tracked],
            }),
          }),
        }
      },
    })

    const { dashboard, flush, until } = await mountDashboard({
      query: { account: 'a9', 'usage.tracked': 'p1' },
      schema,
    })
    const account = dashboard.controls.account

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
    expect(dashboard.usage.controls.tracked.items).toEqual([{ label: 'English', value: 'p1' }])
    expect(dashboard.usage.controls.tracked.display).toBe('English')

    account.reset()
    await flush()
    expect(account.display).toBe('All accounts')
  })
})
