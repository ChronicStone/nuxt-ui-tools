/// <reference types="vue/jsx" />

import { useCookie } from 'nuxt/app'
import { computed, ref, watch } from 'vue'

import {
  ROW_ACTIONS_COLUMN_ID,
  hasVisibleTableRowActions,
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
} from '../utils'
import type { TableColumnState, UseTableColumnsParams } from '../utils'
import { createColumnDefs } from '../utils/columns/defs'

export function useTableColumns(params: UseTableColumnsParams) {
  const tableState = ref<TableColumnState>(createDefaultColumnState())
  const hasRowActions = computed(() => {
    if (!params.schema.value.rowActions) {
      return false
    }

    const tableApi = params.tableApi.value
    if (!tableApi) {
      return false
    }

    return hasVisibleTableRowActions({
      context: params.data.contextData.value,
      layout: params.tableLayout.value,
      pageContext: params.data.pageContextData.value,
      rows: params.data.data.value.rows,
      schema: params.schema.value,
      tableApi,
    })
  })
  const runtimeColumns = computed(() => [
    ...createRuntimeColumns({
      context: params.data.contextData.value,
      schema: params.schema.value,
    }),
    ...(hasRowActions.value
      ? [
          {
            canHide: false,
            configurable: false,
            defaultVisible: true,
            icon: 'i-lucide-ellipsis',
            id: ROW_ACTIONS_COLUMN_ID,
            label: 'Actions',
            pinned: 'right' as const,
          },
        ]
      : []),
  ])

  const orderedColumns = computed(() =>
    createOrderedColumns({
      columnOrder: tableState.value.columnOrder ?? [],
      runtimeColumns: runtimeColumns.value,
    }),
  )

  const visibleOrderedColumns = computed(() =>
    createVisibleOrderedColumns({
      columnVisibility: tableState.value.columnVisibility ?? {},
      orderedColumns: orderedColumns.value,
    }),
  )

  watch(
    runtimeColumns,
    (columns) => {
      tableState.value = syncColumnState({
        currentState: tableState.value,
        runtimeColumns: columns,
        schema: params.schema.value,
      })
    },
    { immediate: true },
  )

  const persistPreferences = computed(() => params.schema.value.persistence?.preferences !== false)
  const preferencesCookie = useCookie<PersistedColumnPreferences | null>(
    `${params.schema.value.tableKey}::columns`,
    { default: () => null, maxAge: 60 * 60 * 24 * 365 },
  )
  if (persistPreferences.value && preferencesCookie.value) {
    tableState.value = applyPersistedPreferences(tableState.value, preferencesCookie.value)
  }
  watch(
    tableState,
    (state) => {
      if (!persistPreferences.value) {
        return
      }
      const next = toPersistedPreferences(state)
      if (JSON.stringify(next) !== JSON.stringify(preferencesCookie.value)) {
        preferencesCookie.value = next
      }
    },
    { deep: true },
  )

  watch(
    () => params.state.queryState.sorting.value,
    (sorting) => {
      tableState.value = syncSortingState({
        currentState: tableState.value,
        sorting: sorting
          ? {
              sortDirection: sorting.dir,
              sortKey: sorting.key,
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
      columnId: options.columnId,
      currentState: tableState.value,
    })
  }

  function setVisibility(options: { columnId: string; visible: boolean }) {
    tableState.value = updateColumnVisibilityState({
      columnId: options.columnId,
      currentState: tableState.value,
      visible: options.visible,
    })
  }

  function setPinning(options: { columnId: string; pinned?: 'left' | 'right' }) {
    tableState.value = updateColumnPinningState({
      columnId: options.columnId,
      currentState: tableState.value,
      pinned: options.pinned,
    })
  }

  function setOrder(options: { columnIds: string[] }) {
    tableState.value = updateColumnOrderState({
      columnIds: options.columnIds,
      currentState: tableState.value,
    })
  }

  function reset() {
    tableState.value = createResetColumnState({
      currentState: tableState.value,
      runtimeColumns: runtimeColumns.value,
      schema: params.schema.value,
    })
  }

  function setSorting(sorting: { key: string; dir: 'asc' | 'desc' } | null) {
    params.state.queryState.resetPagination()
    params.state.queryState.sorting.value = sorting
  }

  function setSortKey(key?: string) {
    params.state.queryState.resetPagination()
    if (!key) {
      params.state.queryState.sorting.value = null
      return
    }

    params.state.queryState.sorting.value = {
      dir: params.state.queryState.sorting.value?.dir ?? 'asc',
      key,
    }
  }

  function setSortDirection(direction: 'asc' | 'desc') {
    params.state.queryState.resetPagination()
    const currentSorting = params.state.queryState.sorting.value

    if (!currentSorting) {
      return
    }

    params.state.queryState.sorting.value = {
      dir: direction,
      key: currentSorting.key,
    }
  }

  function clearSorting() {
    setSorting(null)
  }

  function toggleSorting(key: string) {
    const currentSorting = params.state.queryState.sorting.value

    if (!currentSorting || currentSorting.key !== key) {
      setSorting({ dir: 'asc', key })
      return
    }

    setSorting({
      dir: currentSorting.dir === 'asc' ? 'desc' : 'asc',
      key,
    })
  }

  const sortingState = computed(() => ({
    active: Boolean(params.state.queryState.sorting.value?.key),
    dir: params.state.queryState.sorting.value?.dir,
    key: params.state.queryState.sorting.value?.key,
  }))

  const sortKeys = computed(() =>
    runtimeColumns.value.flatMap((column) => (column.sortableKey ? [column.sortableKey] : [])),
  )

  function getMenuItems(options: { columnId: string }) {
    return createColumnMenuItems({
      columnId: options.columnId,
      getPinnedState,
      getSortState,
      label: orderedColumns.value.find((column) => column.id === options.columnId)?.label,
      orderedColumns: orderedColumns.value,
      schema: params.schema.value,
      setPinning,
      setSorting,
      setVisibility,
    })
  }

  const tableColumns = computed(() => {
    const selectionColumn = createSelectionColumn({ params })
    const dataColumns = createDataColumns({
      getMenuItems,
      getPinnedState,
      getSortState,
      params,
      visibleOrderedColumns: visibleOrderedColumns.value,
    })

    return params.selection.selectionEnabled.value ? [selectionColumn, ...dataColumns] : dataColumns
  })

  const columnDefs = computed(() =>
    createColumnDefs({ params, visibleOrderedColumns: visibleOrderedColumns.value }),
  )

  return {
    clearSorting,
    columnDefs,
    getMenuItems,
    getPinnedState,
    getSortState,
    orderedColumns,
    reset,
    runtimeColumns,
    setOrder,
    setPinning,
    setSortDirection,
    setSortKey,
    setSorting,
    setVisibility,
    sortKeys,
    sortingState,
    tableColumns,
    tableState,
    toggleSorting,
    visibleOrderedColumns,
  }
}

interface PersistedColumnPreferences {
  order: string[]
  pinning: { left?: string[]; right?: string[] }
  sizing: Record<string, number>
  visibility: Record<string, boolean>
}

function toPersistedPreferences(state: TableColumnState): PersistedColumnPreferences {
  return {
    order: state.columnOrder,
    pinning: state.columnPinning,
    sizing: state.columnSizing,
    visibility: state.columnVisibility,
  }
}

function applyPersistedPreferences(
  state: TableColumnState,
  persisted: PersistedColumnPreferences,
): TableColumnState {
  const known = new Set(state.columnOrder)
  return {
    ...state,
    columnOrder: [
      ...persisted.order.filter((id) => known.has(id)),
      ...state.columnOrder.filter((id) => !persisted.order.includes(id)),
    ],
    columnPinning: {
      left: (persisted.pinning.left ?? state.columnPinning.left ?? []).filter((id) =>
        known.has(id),
      ),
      right: (persisted.pinning.right ?? state.columnPinning.right ?? []).filter((id) =>
        known.has(id),
      ),
    },
    columnSizing: Object.fromEntries(
      Object.entries(persisted.sizing).filter(([id]) => known.has(id)),
    ),
    columnVisibility: {
      ...state.columnVisibility,
      ...Object.fromEntries(Object.entries(persisted.visibility).filter(([id]) => known.has(id))),
    },
  }
}
