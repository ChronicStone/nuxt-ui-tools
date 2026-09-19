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
  rowKey: 'id',
  source: {
    query: () => ({
      queryFn: async () => [
        { createdAt: 'x', dropped: 2, firstName: 'Ada', hidden: 1, id: '1', score: 3 },
      ],
      queryKey: ['demo'],
    }),
  },
  table: {
    columns: (column) => [
      column.field('firstName'),
      column.field('score', {
        align: 'right',
        ellipsis: true,
        label: () => 'Score total',
        lines: 1,
        pinned: 'left',
        required: true,
        skeleton: 'number',
        sortable: false,
        summary: 'sum',
      }),
      column.composite('created_at_label', {
        label: 'Créé',
        render: () => 'x',
        sortableKey: 'createdAt',
      }),
      column.display('actions-col', { label: 42, render: () => 'x' }),
      column.field('hidden', { visible: (context) => Boolean(context.showHidden) }),
      column.field('dropped', { condition: () => false }),
      column.field('id', { enabled: false }),
    ],
  },
  tableKey: 'demo',
}) as unknown as TableSchemaView

describe('runtime columns', () => {
  it('humanizes labels, resolves visibility and forwards cell metadata', () => {
    const columns = createRuntimeColumns({ context: {}, schema })
    expect(columns.map((column) => column.id)).toStrictEqual([
      'firstName',
      'score',
      'created_at_label',
      'actions-col',
      'hidden',
    ])
    expect(columns[0]).toMatchObject({
      canHide: true,
      defaultVisible: true,
      ellipsis: false,
      label: 'First Name',
      sortableKey: 'firstName',
    })
    expect(columns[1]).toMatchObject({
      align: 'right',
      canHide: false,
      ellipsis: true,
      label: 'Score total',
      lines: 1,
      pinned: 'left',
      skeleton: 'number',
      sortableKey: undefined,
      summary: 'sum',
    })
    expect(columns[2]).toMatchObject({ label: 'Créé', sortableKey: 'createdAt' })
    expect(columns[3]).toMatchObject({ label: '42', sortableKey: undefined })
    expect(columns[4]?.defaultVisible).toBeFalsy()
    expect(
      createRuntimeColumns({ context: { showHidden: true }, schema })[4]?.defaultVisible,
    ).toBeTruthy()
  })

  it('orders and filters columns from persisted state', () => {
    const runtimeColumns = createRuntimeColumns({ context: {}, schema })
    const ordered = createOrderedColumns({
      columnOrder: ['score', 'unknown', 'firstName', 'score'],
      runtimeColumns,
    })
    expect(ordered.map((column) => column.id)).toStrictEqual([
      'score',
      'firstName',
      'created_at_label',
      'actions-col',
      'hidden',
    ])
    const visible = createVisibleOrderedColumns({
      columnVisibility: { firstName: false, hidden: true },
      orderedColumns: ordered,
    })
    expect(visible.map((column) => column.id)).toStrictEqual([
      'score',
      'created_at_label',
      'actions-col',
      'hidden',
    ])
  })

  it('resolves labels, sortable keys and header icons', () => {
    const score = findSchemaColumn({ columnId: 'score', schema })!
    expect(resolveColumnLabel({ column: score })).toBe('Score total')
    expect(resolveColumnLabel({ column: { ...score, label: () => ({}) as never } })).toBe('Score')
    expect(getSortableKey({ column: findSchemaColumn({ columnId: 'firstName', schema })! })).toBe(
      'firstName',
    )
    expect(getSortableKey({ column: score })).toBeUndefined()
    expect(
      getSortableKey({ column: findSchemaColumn({ columnId: 'created_at_label', schema })! }),
    ).toBe('createdAt')
    expect(findSchemaColumn({ columnId: 'nope', schema })).toBeUndefined()
    function none() {
      return null
    }
    expect(
      getColumnHeaderIcon({ columnId: 'a', getPinnedState: none, getSortState: () => 'asc' }),
    ).toBe('i-lucide-arrow-up')
    expect(
      getColumnHeaderIcon({ columnId: 'a', getPinnedState: none, getSortState: () => 'desc' }),
    ).toBe('i-lucide-arrow-down')
    expect(
      getColumnHeaderIcon({
        canHide: true,
        columnId: 'a',
        getPinnedState: none,
        getSortState: none,
      }),
    ).toBe('i-lucide-chevrons-up-down')
    expect(
      getColumnHeaderIcon({
        canHide: false,
        columnId: 'a',
        getPinnedState: none,
        getSortState: none,
      }),
    ).toBe('i-lucide-grip-vertical')
  })
})
