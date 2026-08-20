import { computed, type ComputedRef } from 'vue'

import type {
  ExtractTableContextData,
  ExtractTablePageContextData,
  ExtractTableRow,
  PublicTableQueryState,
  TableApi,
  TableCursorPaginationApi,
  TableNoPaginationApi,
  TableOffsetPaginationApi,
  TablePaginationApi,
  TableSchemaView,
} from '../types'
import { getDefaultSort, mapPublicQueryState, resolveTableFilterDefaultRules } from '../utils'
import type { useTableColumns } from './use-table-columns'
import type { useTableControls } from './use-table-controls'
import type { UseTableDataReturn } from './use-table-data'
import type { useTableFilters } from './use-table-filters'
import type { useTableLayout } from './use-table-layout'
import type { useTablePagination } from './use-table-pagination'
import type { useTableSelection } from './use-table-selection'
import type { useTableState } from './use-table-state'

export interface UseTableApiParams<TSchema = TableSchemaView> {
  runtimeSchema: ComputedRef<TableSchemaView>
  publicSchema: ComputedRef<TSchema>
  layout: ReturnType<typeof useTableLayout>
  state: ReturnType<typeof useTableState>
  selection: ReturnType<typeof useTableSelection>
  controls: ReturnType<typeof useTableControls>
  columns: ReturnType<typeof useTableColumns>
  filters: ReturnType<typeof useTableFilters>
  pagination: ReturnType<typeof useTablePagination>
  queryContent: UseTableDataReturn
}

export function useTableApi<TSchema = TableSchemaView>(
  params: UseTableApiParams<TSchema>,
): TableApi<TSchema> {
  const state: TableApi<TSchema>['state'] = {
    layout: params.layout.activeLayout,
    query: computed<PublicTableQueryState>(() =>
      mapPublicQueryState({
        queryState: params.state.queryState,
        activeLayout: params.layout.activeLayout.value,
      }),
    ),
    initialized: computed(() => params.queryContent.status.value.initialized),
    isEmpty: computed(() => params.queryContent.data.value.rowCount === 0),
    isLoading: computed(() => params.queryContent.status.value.isPending),
    isRefreshing: computed(() => params.queryContent.status.value.isRefreshing),
  }

  const data: TableApi<TSchema>['data'] = {
    // SAFETY: runtime rows are decoded by the schema source; this projects the public generic row type.
    rows: computed(() => params.queryContent.data.value.rows as ExtractTableRow<TSchema>[]),
    rowCount: computed(() => params.queryContent.data.value.rowCount),
    loadedRowCount: computed(() => params.queryContent.data.value.rows.length),
    totalRowCount: computed(() => params.queryContent.data.value.rowCount),
    // SAFETY: raw rows follow the same schema source contract before client-side shaping.
    rawRows: computed(() => params.queryContent.rawData.value.rows as ExtractTableRow<TSchema>[]),
    rawRowCount: computed(() => params.queryContent.rawData.value.rowCount),
    context: computed(
      // SAFETY: context keys are decoded from the schema context items before publication.
      () => params.queryContent.contextData.value as ExtractTableContextData<TSchema>,
    ),
    pageContext: computed(
      // SAFETY: page-context keys are decoded from the schema page-context items before publication.
      () => params.queryContent.pageContextData.value as ExtractTablePageContextData<TSchema>,
    ),
    requestContext: params.queryContent.requestContext,
    error: params.queryContent.error,
    status: params.queryContent.status,
    refresh: params.queryContent.refreshData(),
    updateRow(row) {
      params.queryContent.updateRows([row])
    },
    updateRows(rows) {
      params.queryContent.updateRows(rows)
    },
  }

  const layoutApi: TableApi<TSchema>['layout'] = {
    state: params.controls.layoutState,
    set: params.controls.setTableLayout,
  }

  const filters: TableApi<TSchema>['filters'] = {
    state: computed(() => params.state.queryState.filters.value),
    search: params.filters.searchQuery,
    activeCount: computed(() => params.filters.activeUiFilters.value.length),
    clear: params.filters.clearAllFilters,
    remove: (key) => params.filters.clearFilter({ key }),
    replace: (rules) => params.filters.replaceFilters({ rules }),
  }

  const pagination = createPublicPaginationApi(params.pagination, params.publicSchema)

  const sorting: TableApi<TSchema>['sorting'] = {
    state: params.columns.sortingState,
    sortKeys: params.columns.sortKeys,
    set: params.columns.setSorting,
    setKey: params.columns.setSortKey,
    setDirection: params.columns.setSortDirection,
    clear: params.columns.clearSorting,
    toggle: params.columns.toggleSorting,
  }

  const selection: TableApi<TSchema>['selection'] = {
    state: computed(() => ({
      selectedKeys: params.selection.selectedKeys.value,
      selectedCount: params.selection.selectedCount.value,
      allSelected: params.selection.allSelected.value,
      partiallySelected: params.selection.partiallySelected.value,
    })),
    clear: params.selection.clearSelection,
    selectAll: params.selection.selectAllRows,
    selectRows: (rowIds) => params.selection.selectRows({ rowIds }),
    unselectRows: (rowIds) => params.selection.unselectRows({ rowIds }),
    toggle: params.selection.toggleRowSelection,
    isSelected: (rowId) => params.selection.isRowSelected({ rowId }),
  }

  const reset: TableApi<TSchema>['reset'] = {
    query() {
      const defaultLayout = params.runtimeSchema.value.defaultLayout
      const nextLayout = defaultLayout ?? 'table'
      const defaultSort = getDefaultSort({ schema: params.runtimeSchema.value, layout: nextLayout })

      params.layout.activeLayout.value = nextLayout
      params.pagination.reset()
      params.columns.setSorting(defaultSort)
      params.state.queryState.filters.value = {
        search: '',
        ui: resolveTableFilterDefaultRules(params.runtimeSchema.value.filters?.ui ?? []),
      }
    },
    all() {
      reset.query()
      selection.clear()
    },
  }

  return {
    state,
    data,
    layout: layoutApi,
    filters,
    pagination,
    sorting,
    selection,
    reset,
    refresh: params.queryContent.refreshData(),
    updateRow: data.updateRow,
    updateRows: data.updateRows,
  }
}

function createPublicPaginationApi<TSchema>(
  pagination: ReturnType<typeof useTablePagination>,
  schema: ComputedRef<TSchema>,
): TablePaginationApi<TSchema>
function createPublicPaginationApi(
  pagination: ReturnType<typeof useTablePagination>,
  _schema: ComputedRef<unknown>,
): TableNoPaginationApi | TableCursorPaginationApi | TableOffsetPaginationApi {
  if (pagination.mode.value === 'cursor')
    return {
      mode: 'cursor',
      state: pagination.cursorState,
      loadMore: pagination.loadMore,
      reset: pagination.reset,
    }

  if (pagination.mode.value === 'none')
    return {
      mode: 'none',
      state: pagination.noneState,
      reset: pagination.reset,
    }

  return {
    mode: 'offset',
    state: pagination.offsetState,
    pageSizeOptions: pagination.pageSizeOptions,
    setPage: pagination.setPage,
    setPageSize: pagination.setPageSize,
    next: pagination.next,
    previous: pagination.previous,
    reset: pagination.reset,
  }
}
