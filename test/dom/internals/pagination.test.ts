import { afterEach, describe, expect, it, vi } from 'vitest'

import { createAccountsSchema, createAuditSchema } from '../fixtures/accounts'
import type { AccountRow } from '../fixtures/accounts'
import { mountLoaded, rows } from '../harness'
import type { Harness } from '../harness'

let harness: Harness | undefined
afterEach(() => harness?.unmount())

describe('offset pagination', () => {
  it('derives page geometry from the schema defaults', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema() })
    const { pagination } = harness.internals
    expect([
      pagination.mode.value,
      pagination.pageSize.value,
      pagination.currentPage.value,
      pagination.totalPages.value,
      pagination.rowCount.value,
      pagination.loadedCount.value,
    ]).toStrictEqual(['offset', 20, 1, 3, 60, 20])
    expect(pagination.canPreviousPage.value).toBeFalsy()
    expect(pagination.canNextPage.value).toBeTruthy()
    expect(pagination.pageSizeOptions.value).toStrictEqual([10, 20, 50])
    expect(pagination.state.value).toMatchObject({
      mode: 'offset',
      pageCount: 3,
      pageIndex: 1,
      totalCount: 60,
    })
  })

  it('navigates pages, clamps out-of-range targets and syncs the URL', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema() })
    const { pagination } = harness.internals
    pagination.next()
    await harness.flush()
    expect([
      pagination.currentPage.value,
      harness.query()['p.page'],
      rows<AccountRow>(harness)[0]?.id,
    ]).toStrictEqual([2, '2', 'acc-21'])

    pagination.setPage(99)
    await harness.flush()
    expect(pagination.currentPage.value).toBe(3)
    expect(pagination.canNextPage.value).toBeFalsy()
    expect(pagination.loadedCount.value).toBe(20)

    pagination.previous()
    await harness.flush()
    expect(pagination.currentPage.value).toBe(2)

    pagination.setPage(0)
    await harness.flush()
    expect([pagination.currentPage.value, harness.query()['p.page']]).toStrictEqual([1, undefined])
  })

  it('changes the page size and resets to the first page', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema() })
    const { pagination } = harness.internals
    pagination.setPage(3)
    await harness.flush()
    pagination.setPageSize(50)
    await harness.flush()
    expect(pagination.pageSize.value).toBe(50)
    expect(pagination.currentPage.value).toBe(1)
    expect(pagination.totalPages.value).toBe(2)
    expect(harness.query()['p.size']).toBe('50')
    expect(harness.internals.queryContent.data.value.rows).toHaveLength(50)
  })

  it('restores state from the URL', async () => {
    harness = await mountLoaded({
      query: { 'p.page': '3', 'p.size': '10' },
      schema: createAccountsSchema(),
    })
    expect(harness.internals.pagination.currentPage.value).toBe(3)
    expect(harness.internals.pagination.pageSize.value).toBe(10)
    expect(rows<AccountRow>(harness)[0]?.id).toBe('acc-21')
  })

  it('swaps to a compatible page size when the layout changes', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema() })
    harness.internals.controls.setTableLayout('grid')
    await harness.flush()
    expect(harness.internals.pagination.pageSizeOptions.value).toStrictEqual([12, 24])
    expect(harness.internals.pagination.pageSize.value).toBe(12)
    harness.internals.controls.setTableLayout('table')
    await harness.flush()
    expect(harness.internals.pagination.pageSize.value).toBe(20)
  })

  it('resets pagination and exposes the public offset API', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema() })
    harness.internals.pagination.setPage(2)
    await harness.flush()
    harness.internals.pagination.reset()
    await harness.flush()
    expect(harness.internals.pagination.currentPage.value).toBe(1)
    const api = harness.table.pagination
    expect(api.mode).toBe('offset')
    if (api.mode === 'offset') {
      expect(api.state.value.pageCount).toBe(3)
      api.next()
      await harness.flush()
      expect(api.state.value.pageIndex).toBe(2)
    }
  })
})

describe('no pagination', () => {
  it('loads every row and disables navigation', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema({ pagination: false }) })
    const { pagination } = harness.internals
    expect([
      pagination.mode.value,
      pagination.loadedCount.value,
      pagination.pageSize.value,
    ]).toStrictEqual(['none', 60, 60])
    expect(pagination.canNextPage.value).toBeFalsy()
    expect(pagination.canPreviousPage.value).toBeFalsy()
    pagination.next()
    await harness.flush()
    expect([pagination.currentPage.value, pagination.noneState.value]).toStrictEqual([
      1,
      {
        loadedCount: 60,
        mode: 'none',
        totalCount: 60,
      },
    ])
  })
})

describe('cursor pagination', () => {
  it('loads pages incrementally until the cursor is exhausted', async () => {
    const onPage = vi.fn()
    harness = await mountLoaded({ schema: createAuditSchema({ onPage, pageSize: 20, total: 45 }) })
    const { pagination } = harness.internals
    expect([
      pagination.mode.value,
      pagination.loadedCount.value,
      pagination.rowCount.value,
    ]).toStrictEqual(['cursor', 20, 45])
    expect(pagination.canNextPage.value).toBeTruthy()
    expect(pagination.canPreviousPage.value).toBeFalsy()
    expect(onPage).toHaveBeenLastCalledWith(null)

    const loading = pagination.loadMore()
    await harness.flush(1)
    await loading
    await harness.until(() => pagination.loadedCount.value === 40)
    expect(onPage).toHaveBeenLastCalledWith('20')

    await pagination.loadMore()
    await harness.until(() => pagination.loadedCount.value === 45)
    expect(pagination.canNextPage.value).toBeFalsy()
    expect(pagination.cursorState.value).toMatchObject({
      hasNextPage: false,
      loadedCount: 45,
      mode: 'cursor',
      totalCount: 45,
    })

    const before = onPage.mock.calls.length
    await pagination.loadMore()
    await harness.flush()
    expect(onPage).toHaveBeenCalledTimes(before)
  })

  it('ignores offset-only operations', async () => {
    harness = await mountLoaded({ schema: createAuditSchema() })
    harness.internals.pagination.setPage(2)
    harness.internals.pagination.setPageSize(5)
    await harness.flush()
    expect(harness.internals.pagination.currentPage.value).toBe(1)
    expect(harness.query()['p.page']).toBeUndefined()
    expect(harness.table.pagination.mode).toBe('cursor')
  })
})
