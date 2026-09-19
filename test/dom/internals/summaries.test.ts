import { afterEach, describe, expect, it } from 'vitest'

import { createAccounts, createAccountsSchema } from '../fixtures/accounts'
import { mountLoaded } from '../harness'
import type { Harness } from '../harness'

let harness: Harness | undefined
afterEach(() => harness?.unmount())

const rows = createAccounts(60)
function sum(list: typeof rows, key: 'contracts' | 'consumption') {
  return list.reduce((total, row) => total + row[key], 0)
}

describe('table summaries', () => {
  it('derives aggregates over the filtered scope and resolves async cells', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema({ rows }) })
    const { summaries } = harness.internals
    expect(summaries.enabled.value).toBeTruthy()
    expect(summaries.columns.value.map((column) => column.id)).toStrictEqual([
      'contracts',
      'consumption',
    ])
    expect(summaries.scope.value).toBe('filtered')
    expect(summaries.scopes.value).toStrictEqual(['filtered', 'page', 'selection'])
    expect(summaries.count.value).toBe(60)
    expect(summaries.cell('contracts')).toStrictEqual({
      error: null,
      loading: false,
      value: sum(rows, 'contracts'),
    })
    await harness.until(() => !summaries.cell('consumption').loading)
    expect(summaries.cell('consumption').value).toBe(sum(rows, 'consumption'))
    expect(summaries.format('consumption')).toBe(`${sum(rows, 'consumption')} t`)
    expect(summaries.format('contracts')).toBe(sum(rows, 'contracts'))
    expect(summaries.loading.value).toBeFalsy()
  })

  it('switches scopes between page, selection and filtered rows', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema({ rows }) })
    const { summaries } = harness.internals
    summaries.setScope('page')
    await harness.flush()
    const page = rows.slice(0, 20)
    expect(summaries.count.value).toBe(20)
    expect(summaries.cell('contracts').value).toBe(sum(page, 'contracts'))

    harness.internals.selection.selectRows({ rowIds: ['acc-1', 'acc-2'] })
    summaries.setScope('selection')
    await harness.flush()
    expect(summaries.count.value).toBe(2)
    expect(summaries.cell('contracts').value).toBe(sum(rows.slice(0, 2), 'contracts'))

    summaries.setScope('filtered')
    harness.internals.filters.setOptionFilterValues({ key: 'status', values: ['active'] })
    await harness.flush()
    const active = rows.filter((row) => row.status === 'active')
    expect(summaries.count.value).toBe(active.length)
    expect(summaries.cell('contracts').value).toBe(sum(active, 'contracts'))
  })

  it('merges schema-level resolvers over derived cells', async () => {
    harness = await mountLoaded({
      schema: createAccountsSchema({
        rows,
        summariesResolve: () => ({ contracts: 999, extra: 1 }),
      }),
    })
    const { summaries } = harness.internals
    await harness.until(() => summaries.cell('contracts').value === 999)
    expect(summaries.cells.value.extra).toStrictEqual({ error: null, loading: false, value: 1 })
  })

  it('is disabled without summary columns and hides selection scope without selection', async () => {
    harness = await mountLoaded({
      schema: createAccountsSchema({ actions: false, rows, summaries: false }),
    })
    expect(harness.internals.summaries.enabled.value).toBeTruthy()
    expect(harness.internals.summaries.scopes.value).toStrictEqual(['filtered', 'page'])
    expect(harness.internals.summaries.label.value).toBeUndefined()
  })

  it('captures resolver errors per cell', async () => {
    const schema = createAccountsSchema({ rows })
    const column = schema.table?.columns?.find((entry) => entry.key === 'consumption')
    if (column) {
      column.summary = { resolve: () => Promise.reject(new Error('nope')) }
    }
    harness = await mountLoaded({ schema })
    const { summaries } = harness.internals
    await harness.until(() => !summaries.cell('consumption').loading)
    expect(summaries.cell('consumption').error).toBeInstanceOf(Error)
    expect(summaries.cell('consumption').value).toBeUndefined()
  })

  it('supports avg, min, max and count kinds', async () => {
    const schema = createAccountsSchema({ rows })
    const columns = schema.table?.columns ?? []
    function byKey(key: string) {
      return columns.find((entry) => entry.key === key)!
    }
    byKey('contracts').summary = 'avg'
    byKey('consumption').summary = 'max'
    byKey('country').summary = 'count'
    byKey('status').summary = { format: (value) => `min ${String(value)}`, kind: 'min' }
    harness = await mountLoaded({ schema })
    const { summaries } = harness.internals
    expect(summaries.cell('contracts').value).toBeCloseTo(sum(rows, 'contracts') / rows.length)
    expect(summaries.cell('consumption').value).toBe(600)
    expect(summaries.cell('country').value).toBe(60)
    expect(summaries.cell('status').value).toBeNull()
    expect(summaries.format('status')).toBe('min null')
  })
})
