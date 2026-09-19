/** @jsxImportSource vue */
/// <reference types="vue/jsx" />

import { findSchemaColumn } from './schema'
import {
  createRowActionsColumn,
  createSelectionColumn,
  normalizeColumnSize,
  renderColumnCell,
} from './render'
import {
  DEFAULT_COLUMN_SIZE,
  MAX_COLUMN_SIZE,
  MIN_COLUMN_SIZE,
  ROW_ACTIONS_COLUMN_ID,
  ROW_ACTIONS_COLUMN_WIDTH,
  SELECT_COLUMN_ID,
  SELECT_COLUMN_WIDTH,
  type DataListColumnDef,
  type TableRuntimeColumn,
  type UseTableColumnsParams,
} from './types'

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
      id: SELECT_COLUMN_ID,
      size: SELECT_COLUMN_WIDTH,
      minSize: SELECT_COLUMN_WIDTH,
      maxSize: MAX_COLUMN_SIZE,
      enableResizing: false,
      meta: {
        label: '',
        sortable: false,
        canHide: false,
        internal: 'selection',
        renderHeader: () => selection.header(),
        render: ({ row, index }) => selection.cell({ row: { id: options.params.selection.getRowId({ row, index }) } }),
      },
    })
  }

  for (const runtimeColumn of options.visibleOrderedColumns) {
    if (runtimeColumn.id === ROW_ACTIONS_COLUMN_ID) {
      const actions = createRowActionsColumn({ params: options.params })
      defs.push({
        id: ROW_ACTIONS_COLUMN_ID,
        size: ROW_ACTIONS_COLUMN_WIDTH,
        minSize: ROW_ACTIONS_COLUMN_WIDTH,
        maxSize: MAX_COLUMN_SIZE,
        enableResizing: false,
        meta: {
          label: runtimeColumn.label,
          sortable: false,
          canHide: false,
          internal: 'actions',
          align: 'right',
          render: ({ row, index }) => actions.cell({ row: { original: row, index } }),
        },
      })
      continue
    }

    const column = findSchemaColumn({ schema: options.params.schema.value, columnId: runtimeColumn.id })
    if (!column) continue

    const sortable = Boolean(runtimeColumn.sortableKey)
    const authored = normalizeColumnSize({ size: runtimeColumn.width })
    const min = normalizeColumnSize({ size: runtimeColumn.minWidth }) ?? MIN_COLUMN_SIZE
    const floor = headerFloor(runtimeColumn.label, sortable)
    defs.push({
      id: runtimeColumn.id,
      size: Math.max(authored ?? DEFAULT_COLUMN_SIZE, Math.min(floor, 260), min),
      minSize: min,
      maxSize: normalizeColumnSize({ size: runtimeColumn.maxWidth }) ?? MAX_COLUMN_SIZE,
      enableResizing: column.resizable !== false,
      meta: {
        label: runtimeColumn.label,
        icon: runtimeColumn.icon,
        ellipsis: runtimeColumn.ellipsis,
        lines: runtimeColumn.lines,
        skeleton: runtimeColumn.skeleton ?? (runtimeColumn.align === 'right' ? 'number' : 'text'),
        align: runtimeColumn.align,
        sortable,
        sortableKey: runtimeColumn.sortableKey,
        canHide: runtimeColumn.canHide,
        render: ({ row, index }) =>
          renderColumnCell({ column, row, rowIndex: index, params: options.params }),
      },
    })
  }

  return defs
}
