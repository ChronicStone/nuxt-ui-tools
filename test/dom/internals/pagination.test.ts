import { afterEach, describe, expect, it, vi } from 'vitest'

import { createAccountsSchema, type AccountRow, createAuditSchema } from '../fixtures/accounts'
import { mountLoaded, type Harness, rows } from '../harness'

let harness: Harness | undefined
afterEach(() => harness?.unmount())

describe('offset pagination', () => {
  it('derives page geometry from the schema defaults', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema() })
    const pagination = harness.internals.pagination
    expect(pagination.mode.value).toBe('offset')
    expect(pagination.pageSize.value).toBe(20)
    expect(pagination.currentPage.value).toBe(1)
    expect(pagination.totalPages.value).toBe(3)
    expect(pagination.rowCount.value).toBe(60)
    expect(pagination.loadedCount.value).toBe(20)
    expect(pagination.canPreviousPage.value).toBe(false)
    expect(pagination.canNextPage.value).toBe(true)
    expect(pagination.pageSizeOptions.value).toEqual([10, 20, 50])
    expect(pagination.state.value).toMatchObject({ mode: 'offset', pageIndex: 1, pageCount: 3, totalCount: 60 })
  })

  it('navigates pages, clamps out-of-range targets and syncs the URL', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema() })
    const pagination = harness.internals.pagination
    pagination.next()
    await harness.flush()
    expect(pagination.currentPage.value).toBe(2)
    expect(harness.query()['p.page']).toBe('2')
    expect(rows<AccountRow>(harness)[0]?.id).toBe('acc-21')

    pagination.setPage(99)
    await harness.flush()
    expect(pagination.currentPage.value).toBe(3)
    expect(pagination.canNextPage.value).toBe(false)
    expect(pagination.loadedCount.value).toBe(20)

    pagination.previous()
    await harness.flush()
    expect(pagination.currentPage.value).toBe(2)

    pagination.setPage(0)
    await harness.flush()
    expect(pagination.currentPage.value).toBe(1)
    expect(harness.query()['p.page']).toBeUndefined()
  })

  it('changes the page size and resets to the first page', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema() })
    const pagination = harness.internals.pagination
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
    harness = await mountLoaded({ schema: createAccountsSchema(), query: { 'p.page': '3', 'p.size': '10' } })
    expect(harness.internals.pagination.currentPage.value).toBe(3)
    expect(harness.internals.pagination.pageSize.value).toBe(10)
    expect(rows<AccountRow>(harness)[0]?.id).toBe('acc-21')
  })

  it('swaps to a compatible page size when the layout changes', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema() })
    harness.internals.controls.setTableLayout('grid')
    await harness.flush()
    expect(harness.internals.pagination.pageSizeOptions.value).toEqual([12, 24])
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
    const pagination = harness.internals.pagination
    expect(pagination.mode.value).toBe('none')
    expect(pagination.loadedCount.value).toBe(60)
    expect(pagination.pageSize.value).toBe(60)
    expect(pagination.canNextPage.value).toBe(false)
    expect(pagination.canPreviousPage.value).toBe(false)
    pagination.next()
    await harness.flush()
    expect(pagination.currentPage.value).toBe(1)
    expect(pagination.noneState.value).toEqual({ mode: 'none', loadedCount: 60, totalCount: 60 })
  })
})

describe('cursor pagination', () => {
  it('loads pages incrementally until the cursor is exhausted', async () => {
    const onPage = vi.fn()
    harness = await mountLoaded({ schema: createAuditSchema({ total: 45, pageSize: 20, onPage }) })
    const pagination = harness.internals.pagination
    expect(pagination.mode.value).toBe('cursor')
    expect(pagination.loadedCount.value).toBe(20)
    expect(pagination.rowCount.value).toBe(45)
    expect(pagination.canNextPage.value).toBe(true)
    expect(pagination.canPreviousPage.value).toBe(false)
    expect(onPage).toHaveBeenLastCalledWith(null)

    const loading = pagination.loadMore()
    await harness.flush(1)
    await loading
    await harness.until(() => pagination.loadedCount.value === 40)
    expect(onPage).toHaveBeenLastCalledWith('20')

    await pagination.loadMore()
    await harness.until(() => pagination.loadedCount.value === 45)
    expect(pagination.canNextPage.value).toBe(false)
    expect(pagination.cursorState.value).toMatchObject({ mode: 'cursor', loadedCount: 45, totalCount: 45, hasNextPage: false })

    const before = onPage.mock.calls.length
    await pagination.loadMore()
    await harness.flush()
    expect(onPage.mock.calls.length).toBe(before)
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
