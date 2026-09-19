import { afterEach, describe, expect, it } from 'vitest'

import { ROW_ACTIONS_COLUMN_ID, SELECT_COLUMN_ID } from '#ui-tools/table/utils/columns/types'

import { createAccountsSchema, type AccountRow } from '../fixtures/accounts'
import { mountLoaded, type Harness, rows } from '../harness'

let harness: Harness | undefined
afterEach(() => harness?.unmount())

describe('table columns', () => {
  it('builds runtime columns with visibility, pinning and cell metadata', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema() })
    const columns = harness.internals.tableColumns
    expect(columns.runtimeColumns.value.map((column) => column.id)).toEqual([
      'name', 'status', 'country', 'legalEntity', 'edofSync', 'contracts', 'consumption', ROW_ACTIONS_COLUMN_ID,
    ])
    expect(columns.visibleOrderedColumns.value.map((column) => column.id)).not.toContain('legalEntity')
    const name = columns.runtimeColumns.value[0]!
    expect(name).toMatchObject({ pinned: 'left', canHide: false, skeleton: 'avatar', sortableKey: 'name', width: 228 })
    expect(columns.runtimeColumns.value.find((column) => column.id === 'country')?.lines).toBe(2)
    expect(columns.runtimeColumns.value.find((column) => column.id === 'legalEntity')?.ellipsis).toBe(true)
    expect(columns.runtimeColumns.value.find((column) => column.id === 'contracts')?.summary).toBe('sum')
    expect(columns.getPinnedState({ columnId: 'name' })).toBe('left')
    expect(columns.getPinnedState({ columnId: ROW_ACTIONS_COLUMN_ID })).toBe('right')
  })

  it('creates TanStack column defs with internal columns and header floors', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema() })
    const defs = harness.internals.tableColumns.columnDefs.value
    expect(defs[0]).toMatchObject({ id: SELECT_COLUMN_ID, size: 44, minSize: 44, enableResizing: false })
    expect(defs[0]?.meta.internal).toBe('selection')
    expect(defs.at(-1)).toMatchObject({ id: ROW_ACTIONS_COLUMN_ID, size: 56, enableResizing: false })
    expect(defs.at(-1)?.meta).toMatchObject({ internal: 'actions', align: 'right' })
    const byId = (id: string) => defs.find((def) => def.id === id)!
    expect(byId('name')).toMatchObject({ size: 228, minSize: 200, enableResizing: true })
    expect(byId('name').meta).toMatchObject({ sortable: true, canHide: false, skeleton: 'avatar' })
    expect(byId('contracts').meta.skeleton).toBe('number')
    expect(byId('country').meta).toMatchObject({ skeleton: 'text', lines: 2, sortable: true })
    expect(byId('edofSync').meta).toMatchObject({ skeleton: 'check', sortable: true })
    expect(byId(ROW_ACTIONS_COLUMN_ID).meta.sortable).toBe(false)
    expect(byId('status').size).toBeGreaterThanOrEqual(110)
    expect(typeof byId('status').meta.render).toBe('function')
    expect(byId('name').meta.renderHeader).toBeUndefined()
    expect(typeof defs[0]?.meta.renderHeader).toBe('function')
  })

  it('toggles visibility, pins, reorders and resets', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema() })
    const columns = harness.internals.tableColumns
    columns.setVisibility({ columnId: 'legalEntity', visible: true })
    columns.setVisibility({ columnId: 'country', visible: false })
    expect(columns.visibleOrderedColumns.value.map((column) => column.id)).toContain('legalEntity')
    expect(columns.visibleOrderedColumns.value.map((column) => column.id)).not.toContain('country')
    expect(columns.columnDefs.value.find((def) => def.id === 'legalEntity')?.meta.ellipsis).toBe(true)

    columns.setPinning({ columnId: 'contracts', pinned: 'right' })
    expect(columns.getPinnedState({ columnId: 'contracts' })).toBe('right')
    columns.setPinning({ columnId: 'contracts' })
    expect(columns.getPinnedState({ columnId: 'contracts' })).toBeNull()

    columns.setOrder({ columnIds: ['name', 'contracts', 'status'] })
    expect(columns.orderedColumns.value.slice(0, 3).map((column) => column.id)).toEqual(['name', 'contracts', 'status'])

    columns.reset()
    expect(columns.orderedColumns.value.slice(0, 3).map((column) => column.id)).toEqual(['name', 'status', 'country'])
    expect(columns.visibleOrderedColumns.value.map((column) => column.id)).toContain('country')
    expect(columns.visibleOrderedColumns.value.map((column) => column.id)).not.toContain('legalEntity')
  })

  it('builds localized column menus reflecting state', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema() })
    const columns = harness.internals.tableColumns
    const menu = columns.getMenuItems({ columnId: 'status' })
    expect(menu[0]).toEqual([{ label: 'Statut', type: 'label', class: 'nut-dl-colmenu__title' }])
    expect(menu[1]?.map((item) => item.label)).toEqual(['Trier A → Z', 'Trier Z → A', 'Ne plus trier'])
    expect(menu[1]?.[2]?.disabled).toBe(true)
    expect(menu[2]?.map((item) => item.label)).toEqual(['Épingler à gauche', 'Épingler à droite'])
    expect(menu[3]?.[0]).toMatchObject({ label: 'Masquer la colonne', disabled: false })

    menu[1]?.[1]?.onSelect?.(new Event('select'))
    await harness.flush()
    expect(columns.getSortState({ columnId: 'status' })).toBe('desc')
    expect(columns.getMenuItems({ columnId: 'status' })[1]?.[1]?.class).toBe('nut-dl-colmenu__item--active')

    const nameMenu = columns.getMenuItems({ columnId: 'name' })
    expect(nameMenu.at(-1)?.[0]).toMatchObject({ label: 'Masquer la colonne', disabled: true })
    expect(nameMenu[2]?.[0]?.label).toBe('Désépingler')
    const actions = columns.getMenuItems({ columnId: ROW_ACTIONS_COLUMN_ID })
    expect(actions.map((group) => group.length)).toEqual([1, 1, 1])
    expect(actions[1]?.[0]?.label).toBe('Désépingler')
  })

  it('sorts through the query state and resets pagination', async () => {
    harness = await mountLoaded({ schema: createAccountsSchema() })
    const columns = harness.internals.tableColumns
    expect(columns.sortingState.value).toEqual({ key: 'name', dir: 'asc', active: true })
    expect(columns.sortKeys.value).toEqual(['name', 'status', 'country', 'legalEntity', 'edofSync', 'contracts', 'consumption'])
    expect(harness.query()['s.key']).toBeUndefined()

    harness.internals.pagination.setPage(2)
    await harness.flush()
    columns.toggleSorting('status')
    await harness.flush()
    expect(columns.sortingState.value).toMatchObject({ key: 'status', dir: 'asc' })
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
    expect(columns.sortingState.value).toMatchObject({ key: 'contracts', dir: 'asc' })
    columns.clearSorting()
    await harness.flush()
    expect(columns.sortingState.value.active).toBe(false)
    expect(harness.query()['s.key']).toBe('')
  })
})
