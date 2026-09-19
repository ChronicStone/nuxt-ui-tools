import { afterEach, describe, expect, it } from 'vitest'

import { createAccountsSchema, type AccountRow } from '../fixtures/accounts'
import { mountLoaded, type Harness } from '../harness'

let harness: Harness | undefined
afterEach(() => harness?.unmount())

describe('table selection', () => {
  it('is enabled by bulk actions in auto mode and disabled without them', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema() })
    expect(harness.internals.selection.selectionEnabled.value).toBe(true)
    harness.unmount()
    harness = await mountLoaded({ schema: createAccountsSchema({ actions: false }) })
    expect(harness.internals.selection.selectionEnabled.value).toBe(false)
    harness.internals.selection.toggleRowSelection({ rowId: 'acc-1' })
    expect(harness.internals.selection.selectedCount.value).toBe(0)
    harness.unmount()
    harness = await mountLoaded({ schema: createAccountsSchema({ actions: false, selection: { mode: true } }) })
    expect(harness.internals.selection.selectionEnabled.value).toBe(true)
  })

  it('toggles rows, tracks partial state and supports shift ranges across the scope', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema() })
    const selection = harness.internals.selection
    selection.toggleRowSelection({ rowId: 'acc-3' })
    expect(selection.isRowSelected({ rowId: 'acc-3' })).toBe(true)
    expect(selection.selectedCount.value).toBe(1)
    expect(selection.partiallySelected.value).toBe(true)
    expect(selection.allSelected.value).toBe(false)
    expect(selection.rowSelection.value).toEqual({ 'acc-3': true })

    selection.toggleRowSelection({ rowId: 'acc-25', shiftKey: true })
    expect(selection.selectedCount.value).toBe(23)
    expect(selection.isRowSelected({ rowId: 'acc-24' })).toBe(true)
    expect(selection.selectedRows.value.map((row) => (row as AccountRow).id)).toContain('acc-25')

    selection.toggleRowSelection({ rowId: 'acc-3', selected: false })
    expect(selection.isRowSelected({ rowId: 'acc-3' })).toBe(false)
    expect(selection.selectedCount.value).toBe(22)
  })

  it('selects every row in the scope and clears', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema() })
    const selection = harness.internals.selection
    selection.toggleAllRows({ selected: true })
    expect(selection.selectedCount.value).toBe(60)
    expect(selection.allSelected.value).toBe(true)
    expect(Object.keys(selection.rowSelection.value)).toHaveLength(20)
    selection.toggleAllRows({ selected: false })
    expect(selection.selectedCount.value).toBe(0)
    selection.selectRows({ rowIds: ['acc-1', 'acc-1', 'acc-2'] })
    expect(selection.selectedKeys.value).toEqual(['acc-1', 'acc-2'])
    selection.clearSelection()
    expect(selection.selectedKeys.value).toEqual([])
    expect(selection.lastTouchedRowId.value).toBeNull()
  })

  it('limits select-all to the page when the scope is page', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema({ selection: { scope: 'page' } }) })
    harness.internals.selection.selectAllRows()
    expect(harness.internals.selection.selectedCount.value).toBe(20)
    expect(harness.internals.selection.allSelected.value).toBe(true)
  })

  it('preserves off-page selection when the page selection is replaced', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema() })
    const selection = harness.internals.selection
    selection.selectRows({ rowIds: ['acc-30'] })
    selection.rowSelection.value = { 'acc-1': true, 'acc-2': false }
    expect(selection.selectedKeys.value).toEqual(['acc-30', 'acc-1'])
    selection.unselectRows({ rowIds: ['acc-30'] })
    expect(selection.selectedKeys.value).toEqual(['acc-1'])
  })

  it('prunes rows that leave the scope and resets the bulk scope when empty', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema() })
    const selection = harness.internals.selection
    selection.selectRows({ rowIds: ['acc-1', 'acc-2'] })
    selection.setBulkScope('all')
    expect(selection.bulkScope.value).toBe('all')
    harness.internals.filters.setOptionFilterValues({ key: 'status', values: ['active'] })
    await harness.flush()
    expect(selection.selectedKeys.value).toEqual(['acc-1'])
    expect(selection.bulkScope.value).toBe('all')
    selection.unselectRows({ rowIds: ['acc-1'] })
    await harness.flush()
    expect(selection.bulkScope.value).toBe('selection')
  })

  it('mirrors the selection through the public API', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema() })
    const api = harness.table.selection
    api.selectRows(['acc-5'])
    expect(api.state.value).toMatchObject({ selectedKeys: ['acc-5'], selectedCount: 1, partiallySelected: true })
    expect(api.isSelected('acc-5')).toBe(true)
    api.clear()
    expect(api.state.value.selectedCount).toBe(0)
  })
})
