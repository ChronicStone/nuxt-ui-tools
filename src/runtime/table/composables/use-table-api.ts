import { computed } from 'vue'
import type { ComputedRef } from 'vue'

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
    initialized: computed(() => params.queryContent.status.value.initialized),
    isEmpty: computed(() => params.queryContent.data.value.rowCount === 0),
    isLoading: computed(() => params.queryContent.status.value.isPending),
    isRefreshing: computed(() => params.queryContent.status.value.isRefreshing),
    layout: params.layout.activeLayout,
    query: computed<PublicTableQueryState>(() =>
      mapPublicQueryState({
        activeLayout: params.layout.activeLayout.value,
        queryState: params.state.queryState,
      }),
    ),
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
    set(layout) {
      params.controls.setTableLayout(layout)
      params.columns.setSorting(getDefaultSort({ layout, schema: params.runtimeSchema.value }))
    },
    state: params.controls.layoutState,
  }

  const filters: TableApi<TSchema>['filters'] = {
    activeCount: computed(() => params.filters.activeUiFilters.value.length),
    clear: params.filters.clearAllFilters,
    remove: (key) => params.filters.clearFilter({ key }),
    replace: (rules) => params.filters.replaceFilters({ rules }),
    search: params.filters.searchQuery,
    state: computed(() => params.state.queryState.filters.value),
  }

  const pagination = createPublicPaginationApi(params.pagination, params.publicSchema)

  const sorting: TableApi<TSchema>['sorting'] = {
    clear: params.columns.clearSorting,
    set: params.columns.setSorting,
    setDirection: params.columns.setSortDirection,
    setKey: params.columns.setSortKey,
    sortKeys: params.columns.sortKeys,
    state: params.columns.sortingState,
    toggle: params.columns.toggleSorting,
  }

  const selection: TableApi<TSchema>['selection'] = {
    clear: params.selection.clearSelection,
    isSelected: (rowId) => params.selection.isRowSelected({ rowId }),
    selectAll: params.selection.selectAllRows,
    selectRows: (rowIds) => params.selection.selectRows({ rowIds }),
    state: computed(() => ({
      allSelected: params.selection.allSelected.value,
      partiallySelected: params.selection.partiallySelected.value,
      selectedCount: params.selection.selectedCount.value,
      selectedKeys: params.selection.selectedKeys.value,
    })),
    toggle: params.selection.toggleRowSelection,
    unselectRows: (rowIds) => params.selection.unselectRows({ rowIds }),
  }

  const reset: TableApi<TSchema>['reset'] = {
    all() {
      reset.query()
      selection.clear()
    },
    query() {
      const { defaultLayout } = params.runtimeSchema.value
      const nextLayout = defaultLayout ?? 'table'
      const defaultSort = getDefaultSort({ layout: nextLayout, schema: params.runtimeSchema.value })

      params.layout.activeLayout.value = nextLayout
      params.pagination.reset()
      params.columns.setSorting(defaultSort)
      params.state.queryState.filters.value = {
        search: '',
        ui: resolveTableFilterDefaultRules(params.runtimeSchema.value.filters?.ui ?? []),
      }
    },
  }

  return {
    data,
    filters,
    layout: layoutApi,
    pagination,
    refresh: params.queryContent.refreshData(),
    reset,
    selection,
    sorting,
    state,
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
  if (pagination.mode.value === 'cursor') {
    return {
      loadMore: pagination.loadMore,
      mode: 'cursor',
      reset: pagination.reset,
      state: pagination.cursorState,
    }
  }

  if (pagination.mode.value === 'none') {
    return {
      mode: 'none',
      reset: pagination.reset,
      state: pagination.noneState,
    }
  }

  return {
    mode: 'offset',
    next: pagination.next,
    pageSizeOptions: pagination.pageSizeOptions,
    previous: pagination.previous,
    reset: pagination.reset,
    setPage: pagination.setPage,
    setPageSize: pagination.setPageSize,
    state: pagination.offsetState,
  }
}
