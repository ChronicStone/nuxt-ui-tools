import { afterEach, describe, expect, it } from 'vitest'

import { ROW_ACTIONS_COLUMN_ID, SELECT_COLUMN_ID } from '#ui-tools/table/utils/columns/types'

import { createAccountsSchema } from '../fixtures/accounts'
import type { AccountRow } from '../fixtures/accounts'
import { mountLoaded, rows } from '../harness'
import type { Harness } from '../harness'

let harness: Harness | undefined
afterEach(() => harness?.unmount())

describe('table columns', () => {
  it('builds runtime columns with visibility, pinning and cell metadata', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema() })
    const columns = harness.internals.tableColumns
    expect(columns.runtimeColumns.value.map((column) => column.id)).toStrictEqual([
      'name',
      'status',
      'country',
      'legalEntity',
      'edofSync',
      'contracts',
      'consumption',
      ROW_ACTIONS_COLUMN_ID,
    ])
    expect(columns.visibleOrderedColumns.value.map((column) => column.id)).not.toContain(
      'legalEntity',
    )
    const name = columns.runtimeColumns.value[0]!
    expect(name).toMatchObject({
      canHide: false,
      pinned: 'left',
      skeleton: 'avatar',
      sortableKey: 'name',
      width: 228,
    })
    expect(columns.runtimeColumns.value.find((column) => column.id === 'country')?.lines).toBe(2)
    expect(
      columns.runtimeColumns.value.find((column) => column.id === 'legalEntity')?.ellipsis,
    ).toBeTruthy()
    expect(columns.runtimeColumns.value.find((column) => column.id === 'contracts')?.summary).toBe(
      'sum',
    )
    expect(columns.getPinnedState({ columnId: 'name' })).toBe('left')
    expect(columns.getPinnedState({ columnId: ROW_ACTIONS_COLUMN_ID })).toBe('right')
  })

  it('creates TanStack column defs with internal columns and header floors', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema() })
    const defs = harness.internals.tableColumns.columnDefs.value
    expect(defs[0]).toMatchObject({
      enableResizing: false,
      id: SELECT_COLUMN_ID,
      minSize: 44,
      size: 44,
    })
    expect(defs[0]?.meta.internal).toBe('selection')
    expect(defs.at(-1)).toMatchObject({
      enableResizing: false,
      id: ROW_ACTIONS_COLUMN_ID,
      size: 56,
    })
    expect(defs.at(-1)?.meta).toMatchObject({ align: 'right', internal: 'actions' })
    function byId(id: string) {
      return defs.find((def) => def.id === id)!
    }
    expect(byId('name')).toMatchObject({ enableResizing: true, minSize: 200, size: 228 })
    expect(byId('name').meta).toMatchObject({ canHide: false, skeleton: 'avatar', sortable: true })
    expect(byId('contracts').meta.skeleton).toBe('number')
    expect(byId('country').meta).toMatchObject({ lines: 2, skeleton: 'text', sortable: true })
    expect(byId('edofSync').meta).toMatchObject({ skeleton: 'check', sortable: true })
    expect(byId(ROW_ACTIONS_COLUMN_ID).meta.sortable).toBeFalsy()
    expect(byId('status').size).toBeGreaterThanOrEqual(110)
    expect(byId('status').meta.render).toBeTypeOf('function')
    expect(byId('name').meta.renderHeader).toBeUndefined()
    expect(defs[0]?.meta.renderHeader).toBeTypeOf('function')
  })

  it('toggles visibility, pins, reorders and resets', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema() })
    const columns = harness.internals.tableColumns
    columns.setVisibility({ columnId: 'legalEntity', visible: true })
    columns.setVisibility({ columnId: 'country', visible: false })
    expect(columns.visibleOrderedColumns.value.map((column) => column.id)).toContain('legalEntity')
    expect(columns.visibleOrderedColumns.value.map((column) => column.id)).not.toContain('country')
    expect(
      columns.columnDefs.value.find((def) => def.id === 'legalEntity')?.meta.ellipsis,
    ).toBeTruthy()

    columns.setPinning({ columnId: 'contracts', pinned: 'right' })
    expect(columns.getPinnedState({ columnId: 'contracts' })).toBe('right')
    columns.setPinning({ columnId: 'contracts' })
    expect(columns.getPinnedState({ columnId: 'contracts' })).toBeNull()

    columns.setOrder({ columnIds: ['name', 'contracts', 'status'] })
    expect(columns.orderedColumns.value.slice(0, 3).map((column) => column.id)).toStrictEqual([
      'name',
      'contracts',
      'status',
    ])

    columns.reset()
    expect(columns.orderedColumns.value.slice(0, 3).map((column) => column.id)).toStrictEqual([
      'name',
      'status',
      'country',
    ])
    expect(columns.visibleOrderedColumns.value.map((column) => column.id)).toContain('country')
    expect(columns.visibleOrderedColumns.value.map((column) => column.id)).not.toContain(
      'legalEntity',
    )
  })

  it('builds localized column menus reflecting state', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema() })
    const columns = harness.internals.tableColumns
    const menu = columns.getMenuItems({ columnId: 'status' })
    expect(menu[0]).toStrictEqual([
      { class: 'nut-dl-colmenu__title', label: 'Statut', type: 'label' },
    ])
    expect(menu[1]?.map((item) => item.label)).toStrictEqual([
      'Trier A → Z',
      'Trier Z → A',
      'Ne plus trier',
    ])
    expect(menu[1]?.[2]?.disabled).toBeTruthy()
    expect(menu[2]?.map((item) => item.label)).toStrictEqual([
      'Épingler à gauche',
      'Épingler à droite',
    ])
    expect(menu[3]?.[0]).toMatchObject({ disabled: false, label: 'Masquer la colonne' })

    menu[1]?.[1]?.onSelect?.(new Event('select'))
    await harness.flush()
    expect(columns.getSortState({ columnId: 'status' })).toBe('desc')
    expect(columns.getMenuItems({ columnId: 'status' })[1]?.[1]?.class).toBe(
      'nut-dl-colmenu__item--active',
    )

    const nameMenu = columns.getMenuItems({ columnId: 'name' })
    expect(nameMenu.at(-1)?.[0]).toMatchObject({ disabled: true, label: 'Masquer la colonne' })
    expect(nameMenu[2]?.[0]?.label).toBe('Désépingler')
    const actions = columns.getMenuItems({ columnId: ROW_ACTIONS_COLUMN_ID })
    expect(actions.map((group) => group.length)).toStrictEqual([1, 1, 1])
    expect(actions[1]?.[0]?.label).toBe('Désépingler')
  })

  it('sorts through the query state and resets pagination', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema() })
    const columns = harness.internals.tableColumns
    expect(columns.sortingState.value).toStrictEqual({ active: true, dir: 'asc', key: 'name' })
    expect(columns.sortKeys.value).toStrictEqual([
      'name',
      'status',
      'country',
      'legalEntity',
      'edofSync',
      'contracts',
      'consumption',
    ])
    expect(harness.query()['s.key']).toBeUndefined()

    harness.internals.pagination.setPage(2)
    await harness.flush()
    columns.toggleSorting('status')
    await harness.flush()
    expect(columns.sortingState.value).toMatchObject({ dir: 'asc', key: 'status' })
    expect(harness.internals.pagination.currentPage.value).toBe(1)
    expect(harness.query()['s.key']).toBe('status')
    expect(harness.query()['s.dir']).toBeUndefined()
    expect(rows<AccountRow>(harness)[0]?.status).toBe('active')

    columns.toggleSorting('status')
    await harness.flush()
    expect(columns.getSortState({ columnId: 'status' })).toBe('desc')
    expect(harness.query()['s.dir']).toBe('desc')
    expect(rows<AccountRow>(harness)[0]?.status).toBe('pending')

    columns.setSortDirection('asc')
    await harness.flush()
    expect(columns.sortingState.value.dir).toBe('asc')
    columns.setSortKey('contracts')
    await harness.flush()
    expect(columns.sortingState.value).toMatchObject({ dir: 'asc', key: 'contracts' })
    columns.clearSorting()
    await harness.flush()
    expect(columns.sortingState.value.active).toBeFalsy()
    expect(harness.query()['s.key']).toBe('')
  })
})
