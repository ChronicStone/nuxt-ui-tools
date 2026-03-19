/// <reference types="vue/jsx" />

import { computed, ref, watch } from 'vue'

import {
  createColumnMenuItems,
  createDefaultColumnState,
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
  type TableColumnState,
  type UseTableColumnsParams,
} from '../utils'

export function useTableColumns(params: UseTableColumnsParams) {
  const tableState = ref<TableColumnState>(createDefaultColumnState())
  const runtimeColumns = computed(() =>
    createRuntimeColumns({
      schema: params.schema.value,
      context: params.data.contextData.value,
    }),
  )

  const orderedColumns = computed(() =>
    createOrderedColumns({
      runtimeColumns: runtimeColumns.value,
      columnOrder: tableState.value.columnOrder ?? [],
    }),
  )

  const visibleOrderedColumns = computed(() =>
    createVisibleOrderedColumns({
      orderedColumns: orderedColumns.value,
      columnVisibility: tableState.value.columnVisibility ?? {},
    }),
  )

  watch(
    runtimeColumns,
    (columns) => {
      tableState.value = syncColumnState({
        schema: params.schema.value,
        runtimeColumns: columns,
        currentState: tableState.value,
      })
    },
    { immediate: true },
  )

  watch(
    () => params.state.queryState.sorting.value,
    (sorting) => {
      tableState.value = syncSortingState({
        currentState: tableState.value,
        sorting: sorting
          ? {
              sortKey: sorting.key,
              sortDirection: sorting.dir,
            }
          : null,
      })
    },
    { immediate: true },
  )

  function getSortState(options: { columnId: string }) {
    const column = orderedColumns.value.find((entry) => entry.id === options.columnId)
    const sorting = params.state.queryState.sorting.value

    if (!column?.sortableKey || sorting?.key !== column.sortableKey) {
      return null
    }

    return sorting.dir
  }

  function getPinnedState(options: { columnId: string }) {
    return resolvePinnedState({
      currentState: tableState.value,
      columnId: options.columnId,
    })
  }

  function setVisibility(options: { columnId: string; visible: boolean }) {
    tableState.value = updateColumnVisibilityState({
      currentState: tableState.value,
      columnId: options.columnId,
      visible: options.visible,
    })
  }

  function setPinning(options: { columnId: string; pinned?: 'left' | 'right' }) {
    tableState.value = updateColumnPinningState({
      currentState: tableState.value,
      columnId: options.columnId,
      pinned: options.pinned,
    })
  }

  function setOrder(options: { columnIds: string[] }) {
    tableState.value = updateColumnOrderState({
      currentState: tableState.value,
      columnIds: options.columnIds,
    })
  }

  function reset() {
    tableState.value = createResetColumnState({
      schema: params.schema.value,
      runtimeColumns: runtimeColumns.value,
      currentState: tableState.value,
    })
  }

  function setSorting(sorting: { key: string; dir: 'asc' | 'desc' } | null) {
    params.state.queryState.pagination.value = {
      ...params.state.queryState.pagination.value,
      pageIndex: 1,
    }
    params.state.queryState.sorting.value = sorting
  }

  function setSortKey(key?: string) {
    if (!key) {
      params.state.queryState.sorting.value = null
      return
    }

    params.state.queryState.sorting.value = {
      key,
      dir: params.state.queryState.sorting.value?.dir ?? 'asc',
    }
  }

  function setSortDirection(direction: 'asc' | 'desc') {
    const currentSorting = params.state.queryState.sorting.value

    if (!currentSorting) {
      return
    }

    params.state.queryState.sorting.value = {
      key: currentSorting.key,
      dir: direction,
    }
  }

  function clearSorting() {
    setSorting(null)
  }

  function toggleSorting(key: string) {
    const currentSorting = params.state.queryState.sorting.value

    if (!currentSorting || currentSorting.key !== key) {
      setSorting({ key, dir: 'asc' })
      return
    }

    setSorting({
      key,
      dir: currentSorting.dir === 'asc' ? 'desc' : 'asc',
    })
  }

  const sortingState = computed(() => ({
    key: params.state.queryState.sorting.value?.key,
    dir: params.state.queryState.sorting.value?.dir,
    active: Boolean(params.state.queryState.sorting.value?.key),
  }))

  const sortKeys = computed(() =>
    runtimeColumns.value.flatMap((column) => (column.sortableKey ? [column.sortableKey] : [])),
  )

  function getMenuItems(options: { columnId: string }) {
    return createColumnMenuItems({
      columnId: options.columnId,
      schema: params.schema.value,
      orderedColumns: orderedColumns.value,
      getSortState,
      getPinnedState,
      setPinning,
      setVisibility,
      setSorting,
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
    tableState,
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
    sortingState,
    sortKeys,
    setSorting,
    setSortKey,
    setSortDirection,
    clearSorting,
    toggleSorting,
  }
}
