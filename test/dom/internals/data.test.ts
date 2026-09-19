import { afterEach, describe, expect, it, vi } from 'vitest'

import { createAccountsSchema, type AccountRow } from '../fixtures/accounts'
import { mountDataList, mountLoaded, type Harness, rows, rawRows } from '../harness'

let harness: Harness | undefined
afterEach(() => harness?.unmount())

describe('table data lifecycle', () => {
  it('reports booting until the startup is released, then pending and initialized', async () => {
    harness = await mountDataList({ schema: createAccountsSchema({ delay: 20 }), start: false, settle: false })
    const status = harness.internals.queryContent.status
    expect(status.value.isBooting).toBe(true)
    expect(status.value.isPending).toBe(true)
    expect(status.value.initialized).toBe(false)
    expect(harness.internals.queryContent.data.value.rows).toEqual([])

    harness.internals.startup.start()
    await harness.flush(1)
    expect(status.value.isBooting).toBe(false)
    expect(status.value.isPending).toBe(true)
    await harness.until(() => status.value.initialized)
    expect(status.value.isPending).toBe(false)
    expect(harness.internals.queryContent.data.value.rows).toHaveLength(20)
    expect(harness.table.state.initialized.value).toBe(true)
    expect(harness.table.state.isEmpty.value).toBe(false)
  })

  it('schedules startup from the root component mount', async () => {
    harness = await mountDataList({ schema: createAccountsSchema(), start: false })
    await harness.until(() => harness!.internals.startup.isActive.value)
    expect(harness.internals.startup.phase.value).toBe('active')
  })

  it('sorts client rows and applies sort direction changes', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema() })
    expect(rows<AccountRow>(harness)[0]?.name).toBe('Compte 001')
    harness.internals.tableColumns.setSortDirection('desc')
    await harness.flush()
    expect(rows<AccountRow>(harness)[0]?.name).toBe('Compte 060')
    expect(harness.internals.queryContent.rawData.value.rows).toHaveLength(60)
    expect(harness.internals.queryContent.selectableRows.value).toHaveLength(60)
  })

  it('surfaces source errors and clears rows', async () => {
    harness = await mountDataList({ schema: createAccountsSchema({ fail: true }) })
    await harness.until(() => Boolean(harness!.internals.queryContent.error.value))
    expect((harness.internals.queryContent.error.value as Error).message).toBe('boom')
    expect(harness.internals.queryContent.data.value.rows).toEqual([])
    expect(harness.internals.queryContent.status.value.isPending).toBe(false)
  })

  it('refreshes data and forwards the request context to the source', async () => {
    const onQuery = vi.fn()
    harness = await mountLoaded({ schema: createAccountsSchema({ onQuery }) })
    expect(onQuery).toHaveBeenCalledTimes(1)
    const context = onQuery.mock.calls[0]?.[0] as { pagination: { mode: string }; sorting: unknown[]; search: { fields: string[] } }
    expect(context.pagination.mode).toBe('offset')
    expect(context.search.fields).toEqual(['name', 'legalEntity'])
    await harness.internals.queryContent.refreshData()()
    await harness.flush()
    expect(onQuery).toHaveBeenCalledTimes(2)
    expect(harness.internals.queryContent.requestContext.value.sorting).toEqual([{ key: 'name', dir: 'asc' }])
  })

  it('updates rows in place through the public API', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema() })
    harness.table.updateRow({ ...harness.table.data.rows.value[0]!, name: 'Zed' })
    await harness.flush()
    expect(rawRows<AccountRow>(harness).some((row) => row.name === 'Zed')).toBe(true)
    expect(rows<AccountRow>(harness).some((row) => row.id === 'acc-1')).toBe(false)
    expect(harness.table.data.rowCount.value).toBe(60)
    expect(harness.table.data.loadedRowCount.value).toBe(20)
  })
})
