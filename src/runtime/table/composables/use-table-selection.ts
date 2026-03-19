import { computed, ref, watch, type ComputedRef } from 'vue'

import type { GenericObject, TableSchemaView } from '../types'
import { resolveTableRowId } from '../utils'
import type { useTableData } from './use-table-data'

export interface UseTableSelectionParams {
  schema: ComputedRef<TableSchemaView>
  queryContent: ReturnType<typeof useTableData>
}

export function useTableSelection(options: UseTableSelectionParams) {
  const selectedKeys = ref<string[]>([])
  const lastTouchedRowId = ref<string | null>(null)
  const rows = computed<GenericObject[]>(() => options.queryContent.data.value.rows)

  const selectionEnabled = computed(() => {
    const mode =
      options.schema.value.table?.selection ?? options.schema.value.selection?.mode ?? 'auto'
    return mode !== false
  })

  const visibleRowIds = computed(() =>
    rows.value.map((row, index) => getRowId({ row, index })),
  )

  const rowSelection = computed({
    get: () =>
      Object.fromEntries(
        visibleRowIds.value
          .filter((rowId) => selectedKeys.value.includes(rowId))
          .map((rowId) => [rowId, true]),
      ),
    set: (selection: Record<string, boolean> = {}) => setRowSelection({ selection }),
  })

  const selectedCount = computed(() => selectedKeys.value.length)

  const allSelected = computed(
    () =>
      visibleRowIds.value.length > 0 &&
      visibleRowIds.value.every((rowId) => selectedKeys.value.includes(rowId)),
  )

  const partiallySelected = computed(
    () =>
      !allSelected.value && visibleRowIds.value.some((rowId) => selectedKeys.value.includes(rowId)),
  )

  const selectedRows = computed(() =>
    rows.value.filter((row, index) =>
      selectedKeys.value.includes(getRowId({ row, index })),
    ),
  )

  function getRowId(params: { row: GenericObject; index?: number }) {
    return String(
      resolveTableRowId({
        rowKey: options.schema.value.rowKey,
        row: params.row,
        index: params.index,
      }),
    )
  }

  function isRowSelected(params: { rowId: string }) {
    return selectedKeys.value.includes(params.rowId)
  }

  function selectRows(params: { rowIds: string[] }) {
    if (!selectionEnabled.value) {
      return
    }

    selectedKeys.value = uniqueRowIds([...selectedKeys.value, ...params.rowIds])
  }

  function unselectRows(params: { rowIds: string[] }) {
    if (!selectionEnabled.value) {
      return
    }

    const removed = new Set(params.rowIds)
    selectedKeys.value = selectedKeys.value.filter((rowId) => !removed.has(rowId))
  }

  function clearSelection() {
    selectedKeys.value = []
    lastTouchedRowId.value = null
  }

  function selectAllRows() {
    if (!selectionEnabled.value) {
      return
    }

    selectedKeys.value = uniqueRowIds([...selectedKeys.value, ...visibleRowIds.value])
  }

  function setRowSelection(params: { selection: Record<string, boolean> }) {
    if (!selectionEnabled.value) {
      clearSelection()
      return
    }

    const visibleIds = new Set(visibleRowIds.value)
    const preservedSelection = selectedKeys.value.filter((rowId) => !visibleIds.has(rowId))
    const nextVisibleSelection = Object.entries(params.selection)
      .filter(([, selected]) => Boolean(selected))
      .map(([rowId]) => rowId)

    selectedKeys.value = uniqueRowIds([...preservedSelection, ...nextVisibleSelection])
  }

  function toggleAllRows(params: { selected: boolean }) {
    if (params.selected) {
      selectAllRows()
      return
    }

    unselectRows({ rowIds: visibleRowIds.value })
  }

  function toggleRowSelection(params: { rowId: string; selected?: boolean; shiftKey?: boolean }) {
    if (!selectionEnabled.value) {
      return
    }

    const nextSelected = params.selected ?? !isRowSelected({ rowId: params.rowId })
    const targetRowIds =
      params.shiftKey && lastTouchedRowId.value
        ? getRangeRowIds({
            anchorRowId: lastTouchedRowId.value,
            targetRowId: params.rowId,
          })
        : [params.rowId]

    if (nextSelected) {
      selectRows({ rowIds: targetRowIds })
    } else {
      unselectRows({ rowIds: targetRowIds })
    }

    lastTouchedRowId.value = params.rowId
  }

  function getRangeRowIds(params: { anchorRowId: string; targetRowId: string }) {
    const anchorIndex = visibleRowIds.value.indexOf(params.anchorRowId)
    const targetIndex = visibleRowIds.value.indexOf(params.targetRowId)

    if (anchorIndex === -1 || targetIndex === -1) {
      return [params.targetRowId]
    }

    const start = Math.min(anchorIndex, targetIndex)
    const end = Math.max(anchorIndex, targetIndex)

    return visibleRowIds.value.slice(start, end + 1)
  }

  watch(
    visibleRowIds,
    (rowIds) => {
      if (!selectedKeys.value.length && !lastTouchedRowId.value) return

      const visibleIdSet = new Set(rowIds)
      selectedKeys.value = selectedKeys.value.filter((rowId) => visibleIdSet.has(rowId))

      if (lastTouchedRowId.value && !visibleIdSet.has(lastTouchedRowId.value)) {
        lastTouchedRowId.value = null
      }
    },
    { immediate: true },
  )

  return {
    selectionEnabled,
    rowSelection,
    selectedKeys,
    selectedRows,
    selectedCount,
    allSelected,
    partiallySelected,
    lastTouchedRowId,
    getRowId,
    isRowSelected,
    setRowSelection,
    selectRows,
    unselectRows,
    clearSelection,
    selectAllRows,
    toggleAllRows,
    toggleRowSelection,
  }
}

function uniqueRowIds(rowIds: string[]) {
  return Array.from(new Set(rowIds))
}
