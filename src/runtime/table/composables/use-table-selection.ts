import { computed, ref, watch, type ComputedRef } from 'vue'

import type { GenericObject, TableSchemaView } from '../types'
import { hasConfiguredTableActions, resolveTableRowId } from '../utils'
import type { useTableData } from './use-table-data'

export interface UseTableSelectionParams {
  schema: ComputedRef<TableSchemaView>
  queryContent: ReturnType<typeof useTableData>
}

export function useTableSelection(options: UseTableSelectionParams) {
  const selectedKeys = ref<string[]>([])
  const lastTouchedRowId = ref<string | null>(null)
  const pageRows = computed<GenericObject[]>(() => options.queryContent.data.value.rows)

  const selectionEnabled = computed(() => {
    const mode =
      options.schema.value.table?.selection ?? options.schema.value.selection?.mode ?? 'auto'
    if (mode !== 'auto') return mode

    return hasConfiguredTableActions(options.schema.value)
  })
  const selectionScope = computed<'page' | 'all'>(() => {
    if (options.schema.value.source.mode === 'remote') return 'page'
    return options.schema.value.selection?.scope ?? 'all'
  })
  const selectionRows = computed<GenericObject[]>(() =>
    selectionScope.value === 'all' ? options.queryContent.selectableRows.value : pageRows.value,
  )
  const pageRowIds = computed(() => pageRows.value.map((row, index) => getRowId({ row, index })))

  const scopeRowIds = computed(() =>
    selectionRows.value.map((row, index) => getRowId({ row, index })),
  )

  const rowSelection = computed({
    get: () =>
      Object.fromEntries(
        pageRowIds.value
          .filter((rowId) => selectedKeys.value.includes(rowId))
          .map((rowId) => [rowId, true]),
      ),
    set: (selection: Record<string, boolean> = {}) => setRowSelection({ selection }),
  })

  const selectedCount = computed(() => selectedKeys.value.length)

  const allSelected = computed(
    () =>
      scopeRowIds.value.length > 0 &&
      scopeRowIds.value.every((rowId) => selectedKeys.value.includes(rowId)),
  )

  const partiallySelected = computed(
    () =>
      !allSelected.value && scopeRowIds.value.some((rowId) => selectedKeys.value.includes(rowId)),
  )

  const selectedRows = computed(() =>
    selectionRows.value.filter((row, index) =>
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

    selectedKeys.value = uniqueRowIds([...selectedKeys.value, ...scopeRowIds.value])
  }

  function setRowSelection(params: { selection: Record<string, boolean> }) {
    if (!selectionEnabled.value) {
      clearSelection()
      return
    }

    const visibleIds = new Set(pageRowIds.value)
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

    unselectRows({ rowIds: scopeRowIds.value })
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
    const anchorIndex = scopeRowIds.value.indexOf(params.anchorRowId)
    const targetIndex = scopeRowIds.value.indexOf(params.targetRowId)

    if (anchorIndex === -1 || targetIndex === -1) {
      return [params.targetRowId]
    }

    const start = Math.min(anchorIndex, targetIndex)
    const end = Math.max(anchorIndex, targetIndex)

    return scopeRowIds.value.slice(start, end + 1)
  }

  watch(
    scopeRowIds,
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
