/// <reference types="vue/jsx" />

import { computed, watch } from 'vue'

import {
  createColumnMenuItems,
  createDataColumns,
  createOrderedColumns,
  createResetColumnState,
  createRuntimeColumns,
  createSelectionColumn,
  createVisibleOrderedColumns,
  getPinnedState as resolvePinnedState,
  syncColumnState,
  syncSortingState,
  updateColumnOrderState,
  updateColumnPinningState,
  updateColumnVisibilityState,
  type UseTableColumnsParams,
} from '../utils'

export function useTableColumns(params: UseTableColumnsParams) {
  const runtimeColumns = computed(() =>
    createRuntimeColumns({
      schema: params.schema.value,
      context: params.data.contextData.value,
    }),
  )

  const orderedColumns = computed(() =>
    createOrderedColumns({
      runtimeColumns: runtimeColumns.value,
      columnOrder: params.tableState.value.columnOrder ?? [],
    }),
  )

  const visibleOrderedColumns = computed(() =>
    createVisibleOrderedColumns({
      orderedColumns: orderedColumns.value,
      columnVisibility: params.tableState.value.columnVisibility ?? {},
    }),
  )

  watch(
    runtimeColumns,
    (columns) => {
      params.tableState.value = syncColumnState({
        schema: params.schema.value,
        runtimeColumns: columns,
        currentState: params.tableState.value,
      })
    },
    { immediate: true },
  )

  watch(
    () => params.query.value.sorting,
    (sorting) => {
      params.tableState.value = syncSortingState({
        currentState: params.tableState.value,
        sorting,
      })
    },
    { immediate: true },
  )

  function getSortState(options: { columnId: string }) {
    const column = orderedColumns.value.find((entry) => entry.id === options.columnId)
    const sorting = params.query.value.sorting

    if (!column?.sortableKey || sorting?.sortKey !== column.sortableKey) {
      return null
    }

    return sorting.sortDirection
  }

  function getPinnedState(options: { columnId: string }) {
    return resolvePinnedState({
      currentState: params.tableState.value,
      columnId: options.columnId,
    })
  }

  function setVisibility(options: { columnId: string; visible: boolean }) {
    params.tableState.value = updateColumnVisibilityState({
      currentState: params.tableState.value,
      columnId: options.columnId,
      visible: options.visible,
    })
  }

  function setPinning(options: { columnId: string; pinned?: 'left' | 'right' }) {
    params.tableState.value = updateColumnPinningState({
      currentState: params.tableState.value,
      columnId: options.columnId,
      pinned: options.pinned,
    })
  }

  function setOrder(options: { columnIds: string[] }) {
    params.tableState.value = updateColumnOrderState({
      currentState: params.tableState.value,
      columnIds: options.columnIds,
    })
  }

  function reset() {
    params.tableState.value = createResetColumnState({
      schema: params.schema.value,
      runtimeColumns: runtimeColumns.value,
      currentState: params.tableState.value,
    })
  }

  function getMenuItems(options: { columnId: string }) {
    return createColumnMenuItems({
      columnId: options.columnId,
      schema: params.schema.value,
      orderedColumns: orderedColumns.value,
      getSortState,
      getPinnedState,
      setPinning,
      setVisibility,
      setSorting: params.api.setSorting,
    })
  }

  const tableColumns = computed(() => {
    const selectionColumn = createSelectionColumn({ params })
    const dataColumns = createDataColumns({
      params,
      visibleOrderedColumns: visibleOrderedColumns.value,
      getMenuItems,
      getPinnedState,
      getSortState,
    })

    return params.selection.selectionEnabled.value ? [selectionColumn, ...dataColumns] : dataColumns
  })

  return {
    tableState: params.tableState,
    tableColumns,
    runtimeColumns,
    orderedColumns,
    visibleOrderedColumns,
    reset,
    setVisibility,
    setPinning,
    setOrder,
    getSortState,
    getPinnedState,
    getMenuItems,
  }
}
