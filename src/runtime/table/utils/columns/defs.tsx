/** @jsxImportSource vue */
/// <reference types="vue/jsx" />

import {
  createRowActionsColumn,
  createSelectionColumn,
  normalizeColumnSize,
  renderColumnCell,
} from './render'
import { findSchemaColumn } from './schema'
import {
  DEFAULT_COLUMN_SIZE,
  MAX_COLUMN_SIZE,
  MIN_COLUMN_SIZE,
  ROW_ACTIONS_COLUMN_ID,
  ROW_ACTIONS_COLUMN_WIDTH,
  SELECT_COLUMN_ID,
  SELECT_COLUMN_WIDTH,
} from './types'
import type { DataListColumnDef, TableRuntimeColumn, UseTableColumnsParams } from './types'

const LABEL_CHAR_WIDTH = 7.2
const LABEL_CHROME_WIDTH = 64

function headerFloor(label: string, sortable: boolean) {
  return Math.ceil(label.length * LABEL_CHAR_WIDTH + LABEL_CHROME_WIDTH + (sortable ? 18 : 0))
}

export function createColumnDefs(options: {
  params: UseTableColumnsParams
  visibleOrderedColumns: TableRuntimeColumn[]
}): DataListColumnDef[] {
  const defs: DataListColumnDef[] = []

  if (options.params.selection.selectionEnabled.value) {
    const selection = createSelectionColumn({ params: options.params })
    defs.push({
      enableResizing: false,
      id: SELECT_COLUMN_ID,
      maxSize: MAX_COLUMN_SIZE,
      meta: {
        canHide: false,
        internal: 'selection',
        label: '',
        render: ({ row, index }) =>
          selection.cell({ row: { id: options.params.selection.getRowId({ row, index }) } }),
        renderHeader: () => selection.header(),
        sortable: false,
      },
      minSize: SELECT_COLUMN_WIDTH,
      size: SELECT_COLUMN_WIDTH,
    })
  }

  for (const runtimeColumn of options.visibleOrderedColumns) {
    if (runtimeColumn.id === ROW_ACTIONS_COLUMN_ID) {
      const actions = createRowActionsColumn({ params: options.params })
      defs.push({
        enableResizing: false,
        id: ROW_ACTIONS_COLUMN_ID,
        maxSize: MAX_COLUMN_SIZE,
        meta: {
          align: 'right',
          canHide: false,
          internal: 'actions',
          label: runtimeColumn.label,
          render: ({ row, index }) => actions.cell({ row: { original: row, index } }),
          sortable: false,
        },
        minSize: ROW_ACTIONS_COLUMN_WIDTH,
        size: ROW_ACTIONS_COLUMN_WIDTH,
      })
      continue
    }

    const column = findSchemaColumn({
      columnId: runtimeColumn.id,
      schema: options.params.schema.value,
    })
    if (!column) {
      continue
    }

    const sortable = Boolean(runtimeColumn.sortableKey)
    const authored = normalizeColumnSize({ size: runtimeColumn.width })
    const min = normalizeColumnSize({ size: runtimeColumn.minWidth }) ?? MIN_COLUMN_SIZE
    const floor = headerFloor(runtimeColumn.label, sortable)
    defs.push({
      enableResizing: column.resizable !== false,
      id: runtimeColumn.id,
      maxSize: normalizeColumnSize({ size: runtimeColumn.maxWidth }) ?? MAX_COLUMN_SIZE,
      meta: {
        align: runtimeColumn.align,
        canHide: runtimeColumn.canHide,
        ellipsis: runtimeColumn.ellipsis,
        icon: runtimeColumn.icon,
        label: runtimeColumn.label,
        lines: runtimeColumn.lines,
        render: ({ row, index }) =>
          renderColumnCell({ column, row, rowIndex: index, params: options.params }),
        skeleton: runtimeColumn.skeleton ?? (runtimeColumn.align === 'right' ? 'number' : 'text'),
        sortable,
        sortableKey: runtimeColumn.sortableKey,
      },
      minSize: min,
      size: Math.max(authored ?? DEFAULT_COLUMN_SIZE, Math.min(floor, 260), min),
    })
  }

  return defs
}
