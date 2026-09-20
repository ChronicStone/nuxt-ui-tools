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

import { must } from '../helpers/must'

const schema = defineTableSchema({
  rowKey: 'id',
  source: {
    query: () => ({
      queryFn: () => [
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
    expect([
      columns.map((column) => column.id),
      columns[0],
      columns[1],
      columns[2],
      columns[3],
    ]).toStrictEqual([
      ['firstName', 'score', 'created_at_label', 'actions-col', 'hidden'],
      expect.objectContaining({
        canHide: true,
        defaultVisible: true,
        ellipsis: false,
        label: 'First Name',
        sortableKey: 'firstName',
      }),
      expect.objectContaining({
        align: 'right',
        canHide: false,
        ellipsis: true,
        label: 'Score total',
        lines: 1,
        pinned: 'left',
        skeleton: 'number',
        sortableKey: undefined,
        summary: 'sum',
      }),
      expect.objectContaining({ label: 'Créé', sortableKey: 'createdAt' }),
      expect.objectContaining({ label: '42', sortableKey: undefined }),
    ])
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
    const score = must(findSchemaColumn({ columnId: 'score', schema }))
    expect([
      resolveColumnLabel({ column: score }),
      resolveColumnLabel({ column: { ...score, label: () => ({}) as never } }),
      getSortableKey({ column: must(findSchemaColumn({ columnId: 'firstName', schema })) }),
    ]).toStrictEqual(['Score total', 'Score', 'firstName'])
    expect(getSortableKey({ column: score })).toBeUndefined()
    expect(
      getSortableKey({ column: must(findSchemaColumn({ columnId: 'created_at_label', schema })) }),
    ).toBe('createdAt')
    expect(findSchemaColumn({ columnId: 'nope', schema })).toBeUndefined()
    function none() {
      return null
    }
    expect([
      getColumnHeaderIcon({ columnId: 'a', getPinnedState: none, getSortState: () => 'asc' }),
      getColumnHeaderIcon({ columnId: 'a', getPinnedState: none, getSortState: () => 'desc' }),
      getColumnHeaderIcon({
        canHide: true,
        columnId: 'a',
        getPinnedState: none,
        getSortState: none,
      }),
      getColumnHeaderIcon({
        canHide: false,
        columnId: 'a',
        getPinnedState: none,
        getSortState: none,
      }),
    ]).toStrictEqual([
      'i-lucide-arrow-up',
      'i-lucide-arrow-down',
      'i-lucide-chevrons-up-down',
      'i-lucide-grip-vertical',
    ])
  })
})
