import { computed, type ComputedRef } from 'vue'

import type {
  ExtractTableContextData,
  ExtractTablePageContextData,
  ExtractTableRow,
  PublicTableQueryState,
  TableApi,
  TableSchemaView,
} from '../types'
import { getDefaultSort, mapPublicQueryState } from '../utils'
import type { useTableColumns } from './use-table-columns'
import type { useTableControls } from './use-table-controls'
import type { UseTableDataReturn } from './use-table-data'
import type { useTableLayout } from './use-table-layout'
import type { useTablePagination } from './use-table-pagination'
import type { useTableSelection } from './use-table-selection'
import type { useTableState } from './use-table-state'

export interface UseTableApiParams<TSchema extends TableSchemaView = TableSchemaView> {
  schema: ComputedRef<TSchema>
  layout: ReturnType<typeof useTableLayout>
  state: ReturnType<typeof useTableState>
  selection: ReturnType<typeof useTableSelection>
  controls: ReturnType<typeof useTableControls>
  columns: ReturnType<typeof useTableColumns>
  pagination: ReturnType<typeof useTablePagination>
  queryContent: UseTableDataReturn
}

export function useTableApi<TSchema extends TableSchemaView = TableSchemaView>(
  params: UseTableApiParams<TSchema>,
): TableApi<TSchema> {
  const state: TableApi<TSchema>['state'] = {
    layout: params.state.activeLayout,
    query: computed<PublicTableQueryState>(() =>
      mapPublicQueryState({
        queryState: params.state.queryState,
        activeLayout: params.state.activeLayout.value,
      }),
    ),
    initialized: computed(() => params.queryContent.status.value.initialized),
    isEmpty: computed(() => params.queryContent.data.value.rowCount === 0),
    isLoading: computed(() => params.queryContent.status.value.isPending),
    isRefreshing: computed(() => params.queryContent.status.value.isRefreshing),
  }

  const data: TableApi<TSchema>['data'] = {
    rows: computed(() => params.queryContent.data.value.rows as ExtractTableRow<TSchema>[]),
    rowCount: computed(() => params.queryContent.data.value.rowCount),
    rawRows: computed(() => params.queryContent.rawData.value.rows as ExtractTableRow<TSchema>[]),
    rawRowCount: computed(() => params.queryContent.rawData.value.rowCount),
    context: computed(
      () => params.queryContent.contextData.value as ExtractTableContextData<TSchema>,
    ),
    pageContext: computed(
      () => params.queryContent.pageContextData.value as ExtractTablePageContextData<TSchema>,
    ),
    requestContext: params.queryContent.requestContext,
    error: params.queryContent.error,
    status: params.queryContent.status,
    refresh: params.queryContent.refreshData(),
  }

  const layout: TableApi<TSchema>['layout'] = {
    state: params.controls.layoutState,
    set: params.controls.setTableLayout,
  }

  const pagination: TableApi<TSchema>['pagination'] = {
    state: params.pagination.state,
    pageSizeOptions: params.pagination.pageSizeOptions,
    setPage: params.pagination.setPage,
    setPageSize: params.pagination.setPageSize,
    next: params.pagination.next,
    previous: params.pagination.previous,
    reset: params.pagination.reset,
  }

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
      const defaultLayout = params.schema.value.defaultLayout
      const layout = defaultLayout ?? 'table'
      const defaultSort = getDefaultSort({ schema: params.schema.value, layout })

      params.layout.activeLayout.value = defaultLayout
      params.pagination.reset()
      params.columns.setSorting(defaultSort)
      params.state.queryState.filters.value = {
        search: '',
        ui: [],
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
    layout,
    pagination,
    sorting,
    selection,
    reset,
  }
}
