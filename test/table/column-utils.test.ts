import { describe, expect, it } from 'vitest'

import { defineTableSchema } from '#ui-tools/table/schema'
import type { TableSchemaView } from '#ui-tools/table/types'
import { getColumnHeaderIcon } from '#ui-tools/table/utils/columns/menu'
import {
  createOrderedColumns,
  createRuntimeColumns,
  createVisibleOrderedColumns,
  findSchemaColumn,
  getSortableKey,
  resolveColumnLabel,
} from '#ui-tools/table/utils/columns/schema'

const schema = defineTableSchema({
  tableKey: 'demo',
  rowKey: 'id',
  source: { query: () => ({ queryKey: ['demo'], queryFn: async () => [{ id: '1', firstName: 'Ada', score: 3, createdAt: 'x', hidden: 1, dropped: 2 }] }) },
  table: {
    columns: (column) => [
      column.field('firstName'),
      column.field('score', { label: () => 'Score total', align: 'right', sortable: false, summary: 'sum', skeleton: 'number', ellipsis: true, lines: 1, required: true, pinned: 'left' }),
      column.composite('created_at_label', { label: 'Créé', sortableKey: 'createdAt', render: () => 'x' }),
      column.display('actions-col', { label: 42, render: () => 'x' }),
      column.field('hidden', { visible: (context) => Boolean(context.showHidden) }),
      column.field('dropped', { condition: () => false }),
      column.field('id', { enabled: false }),
    ],
  },
}) as unknown as TableSchemaView

describe('runtime columns', () => {
  it('humanizes labels, resolves visibility and forwards cell metadata', () => {
    const columns = createRuntimeColumns({ schema, context: {} })
    expect(columns.map((column) => column.id)).toEqual(['firstName', 'score', 'created_at_label', 'actions-col', 'hidden'])
    expect(columns[0]).toMatchObject({ label: 'First Name', canHide: true, defaultVisible: true, sortableKey: 'firstName', ellipsis: false })
    expect(columns[1]).toMatchObject({ label: 'Score total', align: 'right', sortableKey: undefined, summary: 'sum', skeleton: 'number', ellipsis: true, lines: 1, canHide: false, pinned: 'left' })
    expect(columns[2]).toMatchObject({ label: 'Créé', sortableKey: 'createdAt' })
    expect(columns[3]).toMatchObject({ label: '42', sortableKey: undefined })
    expect(columns[4]?.defaultVisible).toBe(false)
    expect(createRuntimeColumns({ schema, context: { showHidden: true } })[4]?.defaultVisible).toBe(true)
  })

  it('orders and filters columns from persisted state', () => {
    const runtimeColumns = createRuntimeColumns({ schema, context: {} })
    const ordered = createOrderedColumns({ runtimeColumns, columnOrder: ['score', 'unknown', 'firstName', 'score'] })
    expect(ordered.map((column) => column.id)).toEqual(['score', 'firstName', 'created_at_label', 'actions-col', 'hidden'])
    const visible = createVisibleOrderedColumns({ orderedColumns: ordered, columnVisibility: { firstName: false, hidden: true } })
    expect(visible.map((column) => column.id)).toEqual(['score', 'created_at_label', 'actions-col', 'hidden'])
  })

  it('resolves labels, sortable keys and header icons', () => {
    const score = findSchemaColumn({ schema, columnId: 'score' })!
    expect(resolveColumnLabel({ column: score })).toBe('Score total')
    expect(resolveColumnLabel({ column: { ...score, label: () => ({}) as never } })).toBe('Score')
    expect(getSortableKey({ column: findSchemaColumn({ schema, columnId: 'firstName' })! })).toBe('firstName')
    expect(getSortableKey({ column: score })).toBeUndefined()
    expect(getSortableKey({ column: findSchemaColumn({ schema, columnId: 'created_at_label' })! })).toBe('createdAt')
    expect(findSchemaColumn({ schema, columnId: 'nope' })).toBeUndefined()
    const none = () => null
    expect(getColumnHeaderIcon({ columnId: 'a', getSortState: () => 'asc', getPinnedState: none })).toBe('i-lucide-arrow-up')
    expect(getColumnHeaderIcon({ columnId: 'a', getSortState: () => 'desc', getPinnedState: none })).toBe('i-lucide-arrow-down')
    expect(getColumnHeaderIcon({ columnId: 'a', getSortState: none, getPinnedState: none, canHide: true })).toBe('i-lucide-chevrons-up-down')
    expect(getColumnHeaderIcon({ columnId: 'a', getSortState: none, getPinnedState: none, canHide: false })).toBe('i-lucide-grip-vertical')
  })
})
