import type { TableSchemaView } from '../../types'
import { findSchemaColumn, uniqueColumnIds } from './schema'
import { ROW_ACTIONS_COLUMN_ID, SELECT_COLUMN_ID, type TableColumnState } from './types'

export function createDefaultColumnState() {
  return {
    columnOrder: [],
    columnVisibility: {},
    columnPinning: { left: [SELECT_COLUMN_ID], right: [] },
    columnSizing: {},
    columnSizingInfo: {
      startOffset: null,
      startSize: null,
      deltaOffset: null,
      deltaPercentage: null,
      isResizingColumn: false as const,
      columnSizingStart: [] as Array<[string, number]>,
    },
    sorting: [],
  }
}

export function syncColumnState(options: {
  schema: TableSchemaView
  runtimeColumns: Array<{ id: string; defaultVisible: boolean; pinned?: 'left' | 'right' }>
  currentState: TableColumnState
}) {
  const columnIds = options.runtimeColumns.map((column) => column.id)
  const nextVisibility = Object.fromEntries(
    options.runtimeColumns.map((column) => [
      column.id,
      options.currentState.columnVisibility?.[column.id] ?? column.defaultVisible,
    ]),
  )
  const visibleColumnIds = options.runtimeColumns
    .filter((column) => nextVisibility[column.id] !== false)
    .map((column) => column.id)
  const nextColumnOrder = uniqueColumnIds({
    columnIds: [
      ...(options.currentState.columnOrder ?? []).filter((columnId: string) =>
        columnIds.includes(columnId),
      ),
      ...columnIds,
    ],
  })

  return {
    ...options.currentState,
    columnOrder: nextColumnOrder,
    columnVisibility: nextVisibility,
    columnPinning: sanitizeColumnPinning({
      schema: options.schema,
      runtimeColumns: options.runtimeColumns,
      visibleColumnIds,
      currentPinning: options.currentState.columnPinning,
    }),
  }
}

export function syncSortingState(options: {
  currentState: TableColumnState
  sorting: { sortKey?: string; sortDirection?: 'asc' | 'desc' } | null | undefined
}) {
  return {
    ...options.currentState,
    sorting: options.sorting?.sortKey
      ? [{ id: options.sorting.sortKey, desc: options.sorting.sortDirection === 'desc' }]
      : [],
  }
}

export function updateColumnVisibilityState(options: {
  currentState: TableColumnState
  columnId: string
  visible: boolean
}) {
  const left = ((options.currentState.columnPinning?.left as string[] | undefined) ?? []).filter(
    (id) => options.visible || id !== options.columnId,
  )
  const right = ((options.currentState.columnPinning?.right as string[] | undefined) ?? []).filter(
    (id) => options.visible || id !== options.columnId,
  )

  return {
    ...options.currentState,
    columnVisibility: {
      ...options.currentState.columnVisibility,
      [options.columnId]: options.visible,
    },
    columnPinning: {
      left: uniqueColumnIds({
        columnIds: [SELECT_COLUMN_ID, ...left.filter((id) => id !== SELECT_COLUMN_ID)],
      }),
      right: normalizeRightPinnedIds({
        columnIds: right.filter((id) => id !== SELECT_COLUMN_ID),
      }),
    },
  }
}

export function updateColumnPinningState(options: {
  currentState: TableColumnState
  columnId: string
  pinned?: 'left' | 'right'
}) {
  const left = ((options.currentState.columnPinning?.left as string[] | undefined) ?? []).filter(
    (id) => id !== options.columnId,
  )
  const right = ((options.currentState.columnPinning?.right as string[] | undefined) ?? []).filter(
    (id) => id !== options.columnId,
  )

  if (options.pinned === 'left') {
    left.push(options.columnId)
  } else if (options.pinned === 'right') {
    right.push(options.columnId)
  }

  return {
    ...options.currentState,
    columnPinning: {
      left: uniqueColumnIds({
        columnIds: [SELECT_COLUMN_ID, ...left],
      }),
      right: normalizeRightPinnedIds({
        columnIds: right.filter((id) => id !== SELECT_COLUMN_ID),
      }),
    },
  }
}

export function updateColumnOrderState(options: {
  currentState: TableColumnState
  columnIds: string[]
}) {
  return {
    ...options.currentState,
    columnOrder: uniqueColumnIds({
      columnIds: options.columnIds,
    }),
  }
}

export function createResetColumnState(options: {
  schema: TableSchemaView
  runtimeColumns: Array<{ id: string; defaultVisible: boolean; pinned?: 'left' | 'right' }>
  currentState: TableColumnState
}) {
  return {
    ...options.currentState,
    columnOrder: options.runtimeColumns.map((column) => column.id),
    columnVisibility: Object.fromEntries(
      options.runtimeColumns.map((column) => [column.id, column.defaultVisible]),
    ),
    columnPinning: {
      left: uniqueColumnIds({
        columnIds: [
          SELECT_COLUMN_ID,
          ...options.runtimeColumns
            .filter(
              (column) =>
                resolvePinnedSide({
                  schema: options.schema,
                  columnId: column.id,
                  pinned: column.pinned,
                }) === 'left',
            )
            .map((column) => column.id),
        ],
      }),
      right: normalizeRightPinnedIds({
        columnIds: options.runtimeColumns
          .filter(
            (column) =>
              resolvePinnedSide({
                schema: options.schema,
                columnId: column.id,
                pinned: column.pinned,
              }) === 'right',
          )
          .map((column) => column.id),
      }),
    },
    columnSizing: {},
    columnSizingInfo: createDefaultColumnState().columnSizingInfo,
  }
}

export function getPinnedState(options: { currentState: TableColumnState; columnId: string }) {
  if (options.currentState.columnPinning?.left?.includes(options.columnId)) {
    return 'left'
  }

  if (options.currentState.columnPinning?.right?.includes(options.columnId)) {
    return 'right'
  }

  return null
}

function sanitizeColumnPinning(options: {
  schema: TableSchemaView
  runtimeColumns: Array<{ id: string; pinned?: 'left' | 'right' }>
  visibleColumnIds: string[]
  currentPinning?: {
    left?: string[]
    right?: string[]
  }
}) {
  const columnIds = options.runtimeColumns.map((column) => column.id)
  const pinnedLeft = uniqueColumnIds({
    columnIds: [
      SELECT_COLUMN_ID,
      ...options.runtimeColumns
        .filter(
          (column) =>
            resolvePinnedSide({
              schema: options.schema,
              columnId: column.id,
              pinned: column.pinned,
            }) === 'left',
        )
        .map((column) => column.id),
      ...((options.currentPinning?.left as string[] | undefined) ?? []).filter((columnId) =>
        columnIds.includes(columnId),
      ),
    ],
  }).filter(
    (columnId) => columnId === SELECT_COLUMN_ID || options.visibleColumnIds.includes(columnId),
  )

  const pinnedRight = normalizeRightPinnedIds({
    columnIds: uniqueColumnIds({
      columnIds: [
        ...options.runtimeColumns
          .filter(
            (column) =>
              resolvePinnedSide({
                schema: options.schema,
                columnId: column.id,
                pinned: column.pinned,
              }) === 'right',
          )
          .map((column) => column.id),
        ...((options.currentPinning?.right as string[] | undefined) ?? []).filter((columnId) =>
          columnIds.includes(columnId),
        ),
      ],
    }).filter(
      (columnId) => options.visibleColumnIds.includes(columnId) && !pinnedLeft.includes(columnId),
    ),
  })

  return {
    left: pinnedLeft,
    right: pinnedRight,
  }
}

function resolvePinnedSide(options: {
  schema: TableSchemaView
  columnId: string
  pinned?: 'left' | 'right'
}) {
  return (
    options.pinned ??
    findSchemaColumn({ schema: options.schema, columnId: options.columnId })?.pinned
  )
}

function normalizeRightPinnedIds(options: { columnIds: string[] }) {
  const ids = uniqueColumnIds({
    columnIds: options.columnIds.filter((id) => id !== SELECT_COLUMN_ID),
  })

  if (!ids.includes(ROW_ACTIONS_COLUMN_ID)) return ids

  return [...ids.filter((id) => id !== ROW_ACTIONS_COLUMN_ID), ROW_ACTIONS_COLUMN_ID]
}
