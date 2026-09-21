import { afterEach, describe, expect, it, vi } from 'vitest'

import { must } from '../../helpers/must'
import { createAccountsSchema } from '../fixtures/accounts'
import type { AccountRow } from '../fixtures/accounts'
import { mountDataList, mountLoaded, rows, rawRows } from '../harness'
import type { Harness } from '../harness'

let harness: Harness | undefined
afterEach(() => harness?.unmount())

describe('table data lifecycle', () => {
  it('reports booting until the startup is released, then pending and initialized', async () => {
    harness = await mountDataList({
      schema: createAccountsSchema({ delay: 20 }),
      settle: false,
      start: false,
    })
    const { status } = harness.internals.queryContent
    expect(status.value.isBooting).toBeTruthy()
    expect(status.value.isPending).toBeTruthy()
    expect(status.value.initialized).toBeFalsy()
    expect(harness.internals.queryContent.data.value.rows).toStrictEqual([])

    harness.internals.startup.start()
    await harness.flush(1)
    expect(status.value.isBooting).toBeFalsy()
    expect(status.value.isPending).toBeTruthy()
    await harness.until(() => status.value.initialized)
    expect(status.value.isPending).toBeFalsy()
    expect(harness.internals.queryContent.data.value.rows).toHaveLength(20)
    expect(harness.table.state.initialized.value).toBeTruthy()
    expect(harness.table.state.isEmpty.value).toBeFalsy()
  })

  it('schedules startup from the root component mount', async () => {
    harness = await mountDataList({ schema: createAccountsSchema(), start: false })
    await harness.until(() => must(harness).internals.startup.isActive.value)
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
    await harness.until(() => Boolean(must(harness).internals.queryContent.error.value))
    expect((harness.internals.queryContent.error.value as Error).message).toBe('boom')
    expect(harness.internals.queryContent.data.value.rows).toStrictEqual([])
    expect(harness.internals.queryContent.status.value.isPending).toBeFalsy()
  })

  it('preserves the last successful pagination contract when a replacement request fails', async () => {
    let fail = false
    harness = await mountLoaded({
      schema: createAccountsSchema({ embeddedFacets: true, fail: () => fail }),
    })
    expect(harness.internals.queryContent.data.value.rowCount).toBe(60)

    fail = true
    harness.internals.filters.searchQuery.value = 'replacement request'
    await harness.until(() => Boolean(must(harness).internals.queryContent.error.value))

    expect(harness.internals.queryContent.data.value.rowCount).toBe(60)
    expect(harness.internals.queryContent.data.value.rows).toHaveLength(60)
  })

  it('refreshes data and forwards the request context to the source', async () => {
    const onQuery = vi.fn()
    harness = await mountLoaded({ schema: createAccountsSchema({ onQuery }) })
    expect(onQuery).toHaveBeenCalledOnce()
    const context = onQuery.mock.calls[0]?.[0] as {
      pagination: { mode: string }
      sorting: unknown[]
      search: { fields: string[] }
    }
    expect(context.pagination.mode).toBe('offset')
    expect(context.search.fields).toStrictEqual(['name', 'legalEntity'])
    await harness.internals.queryContent.refreshData()()
    await harness.flush()
    expect(onQuery).toHaveBeenCalledTimes(2)
    expect(harness.internals.queryContent.requestContext.value.sorting).toStrictEqual([
      { dir: 'asc', key: 'name' },
    ])
  })

  it('keeps embedded remote facets available after the row request settles', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema({ embeddedFacets: true }) })

    await harness.until(
      () => harness?.internals.queryContent.facets.value.facets[0]?.options.length === 3,
    )

    expect(harness.internals.queryContent.facets.value.facets).toStrictEqual([
      {
        key: 'country',
        options: [
          { count: 20, value: 'FR' },
          { count: 20, value: 'DE' },
          { count: 20, value: 'ES' },
        ],
      },
    ])
  })

  it('updates rows in place through the public API', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema() })
    harness.table.updateRow({ ...must(harness.table.data.rows.value[0]), name: 'Zed' })
    await harness.flush()
    expect(rawRows<AccountRow>(harness).some((row) => row.name === 'Zed')).toBeTruthy()
    expect(rows<AccountRow>(harness).some((row) => row.id === 'acc-1')).toBeFalsy()
    expect(harness.table.data.rowCount.value).toBe(60)
    expect(harness.table.data.loadedRowCount.value).toBe(20)
  })
})
