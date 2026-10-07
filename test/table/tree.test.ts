import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest'
import { computed, effectScope, ref } from 'vue'

import { defineTableSchema, tableSource } from '#ui-tools/table'
import { useTableTree } from '#ui-tools/table/composables/use-table-tree'
import type { TableChildrenKey, TableSchemaView } from '#ui-tools/table/types'

interface Invoice {
  id: string
  number: string
  creditNotes?: Invoice[]
}

const invoices: Invoice[] = [
  {
    creditNotes: [
      { id: 'cn-1', number: 'CN-1' },
      { creditNotes: [{ id: 'cn-2-1', number: 'CN-2-1' }], id: 'cn-2', number: 'CN-2' },
    ],
    id: 'inv-1',
    number: 'INV-1',
  },
  { id: 'inv-2', number: 'INV-2' },
  { creditNotes: [{ id: 'cn-3', number: 'CN-3' }], id: 'inv-3', number: 'INV-3' },
]

function mount(tree: { children: 'creditNotes'; defaultExpanded?: boolean | number }) {
  const rows = ref<Invoice[]>(invoices)
  const schema = defineTableSchema({
    rowKey: 'id',
    source: tableSource({
      mode: 'client',
      query: () => ({ queryFn: () => invoices, queryKey: ['tree-test'] }),
    }),
    table: { columns: (column) => [column.field('number')], tree },
    tableKey: 'tree-test',
  })
  const scope = effectScope()
  const api = scope.run(() =>
    useTableTree({
      queryContent: { data: computed(() => ({ rowCount: rows.value.length, rows: rows.value })) },
      // SAFETY: a defined schema is the runtime schema view the composable reads.
      schema: computed(() => schema as unknown as TableSchemaView),
    }),
  )
  if (!api) throw new Error('the tree composable did not mount')
  return { api, rows, scope }
}

const visibleIds = (api: ReturnType<typeof mount>['api']) =>
  api.visibleNodes.value.map((node) => node.id)

describe('useTableTree', () => {
  it('shows only the top level until a branch opens', () => {
    const { api } = mount({ children: 'creditNotes' })
    expect(visibleIds(api)).toStrictEqual(['inv-1', 'inv-2', 'inv-3'])
    api.expansion.expand(['inv-1'])
    expect(visibleIds(api)).toStrictEqual(['inv-1', 'cn-1', 'cn-2', 'inv-2', 'inv-3'])
  })

  it('opens branches by depth from defaultExpanded', () => {
    expect(visibleIds(mount({ children: 'creditNotes', defaultExpanded: true }).api)).toHaveLength(
      7,
    )
    expect(visibleIds(mount({ children: 'creditNotes', defaultExpanded: 1 }).api)).toStrictEqual([
      'inv-1',
      'cn-1',
      'cn-2',
      'inv-2',
      'inv-3',
      'cn-3',
    ])
  })

  it('keeps what was toggled over the default', () => {
    const { api } = mount({ children: 'creditNotes', defaultExpanded: true })
    api.expansion.collapse(['inv-1'])
    expect(api.expansion.isExpanded('inv-1')).toBeFalsy()
    expect(api.expansion.isExpanded('inv-3')).toBeTruthy()
    api.expansion.expand(['inv-1'])
    expect(api.expansion.isExpanded('inv-1')).toBeTruthy()
  })

  it('applies expandAll and collapseAll to rows that load later, and reset returns to the schema', () => {
    const { api, rows } = mount({ children: 'creditNotes' })
    api.expansion.expandAll()
    rows.value = [
      ...invoices,
      { creditNotes: [{ id: 'cn-4', number: 'CN-4' }], id: 'inv-4', number: 'INV-4' },
    ]
    expect(api.expansion.isExpanded('inv-4')).toBeTruthy()
    api.expansion.collapseAll()
    expect(visibleIds(api)).toStrictEqual(['inv-1', 'inv-2', 'inv-3', 'inv-4'])
    api.expansion.expand(['inv-3'])
    api.expansion.reset()
    expect(api.expansion.state.value.expandedKeys).toStrictEqual([])
  })

  it('reports what is open, defaults included', () => {
    const { api } = mount({ children: 'creditNotes', defaultExpanded: 1 })
    expect(api.expansion.state.value).toStrictEqual({
      allExpanded: false,
      branchCount: 3,
      enabled: true,
      expandedCount: 2,
      expandedKeys: ['inv-1', 'inv-3'],
    })
    api.expansion.expandAll()
    expect(api.expansion.state.value.allExpanded).toBeTruthy()
  })

  it('toggles a row, or sets it when told which way', () => {
    const { api } = mount({ children: 'creditNotes' })
    api.expansion.toggle({ rowId: 'inv-1' })
    expect(api.expansion.isExpanded('inv-1')).toBeTruthy()
    api.expansion.toggle({ expanded: true, rowId: 'inv-1' })
    expect(api.expansion.isExpanded('inv-1')).toBeTruthy()
    api.expansion.toggle({ expanded: false, rowId: 'inv-1' })
    expect(api.expansion.isExpanded('inv-1')).toBeFalsy()
  })

  it('ignores rows that have no children or are unknown', () => {
    const { api } = mount({ children: 'creditNotes' })
    api.expansion.expand(['inv-2', 'missing'])
    expect(api.expansion.state.value.expandedKeys).toStrictEqual([])
    expect(visibleIds(api)).toStrictEqual(['inv-1', 'inv-2', 'inv-3'])
  })

  it('lets children carry a checkbox unless limited to the top level', () => {
    const { api } = mount({ children: 'creditNotes' })
    const child = api.index.value.byId.get('cn-1')
    expect(child && api.isSelectable(child)).toBeTruthy()
    expect(api.selectable.value).toBe('all')
  })

  it('does nothing without table.tree', () => {
    const schema = defineTableSchema({
      rowKey: 'id',
      source: tableSource({
        mode: 'client',
        query: () => ({ queryFn: () => invoices, queryKey: ['no-tree'] }),
      }),
      table: { columns: (column) => [column.field('number')] },
      tableKey: 'no-tree',
    })
    const api = effectScope().run(() =>
      useTableTree({
        queryContent: { data: computed(() => ({ rowCount: 3, rows: invoices })) },
        // SAFETY: a defined schema is the runtime schema view the composable reads.
        schema: computed(() => schema as unknown as TableSchemaView),
      }),
    )
    expect(api?.enabled.value).toBeFalsy()
    expect(api?.expansion.state.value.enabled).toBeFalsy()
  })
})

describe('branch motion', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('reveals the new rows in place, then lets the motion go', () => {
    const { api } = mount({ children: 'creditNotes' })
    api.toggleRow('inv-1')
    expect(api.isExpanded('inv-1')).toBeTruthy()
    expect(api.motionOf('cn-1')).toStrictEqual({ kind: 'enter', order: 0 })
    expect(api.motionOf('cn-2')).toStrictEqual({ kind: 'enter', order: 1 })
    vi.advanceTimersByTime(1000)
    expect(api.motionOf('cn-1')).toBeUndefined()
  })

  it('keeps the rows until they have left, but shows the chevron closed at once', () => {
    const { api } = mount({ children: 'creditNotes', defaultExpanded: 1 })
    api.toggleRow('inv-1')
    expect(api.isExpanded('inv-1')).toBeFalsy()
    expect(visibleIds(api)).toContain('cn-1')
    expect(api.motionOf('cn-1')?.kind).toBe('leave')
    vi.advanceTimersByTime(200)
    expect(visibleIds(api)).not.toContain('cn-1')
    expect(api.motionOf('cn-1')).toBeUndefined()
  })

  it('stays open when pressed again while closing', () => {
    const { api } = mount({ children: 'creditNotes', defaultExpanded: 1 })
    api.toggleRow('inv-1')
    api.toggleRow('inv-1')
    vi.advanceTimersByTime(500)
    expect(api.isExpanded('inv-1')).toBeTruthy()
    expect(visibleIds(api)).toContain('cn-1')
  })

  it('lights the path to a row down to the child it turns into', () => {
    const { api } = mount({ children: 'creditNotes', defaultExpanded: true })
    api.lightLineage('cn-2-1')
    // inv-1's vertical is lit down to cn-2 (flat index 2), cn-2's down to cn-2-1 (index 3).
    expect([api.litUntil('inv-1'), api.litUntil('cn-2'), api.litUntil('cn-1')]).toStrictEqual([
      2, 3, -1,
    ])
    expect([api.isOnPath('inv-1'), api.isOnPath('cn-2'), api.isOnPath('cn-2-1')]).toStrictEqual([
      true,
      true,
      false,
    ])
    api.lightLineage()
    expect(api.litUntil('inv-1')).toBe(-1)
  })
})

describe('table.tree typing', () => {
  it('offers only the keys that hold rows', () => {
    expectTypeOf<TableChildrenKey<Invoice>>().toEqualTypeOf<'creditNotes'>()
  })

  it('falls back to any string for an untyped row', () => {
    expectTypeOf<TableChildrenKey<object>>().toEqualTypeOf<string>()
  })
})
