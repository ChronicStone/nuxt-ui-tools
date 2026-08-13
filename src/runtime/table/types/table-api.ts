import type { ComputedRef, WritableComputedRef } from 'vue'

import type { useTableData } from '../composables/use-table-data'
import type { TableFilterState } from './query-state'
import type { TableSchemaView } from './schema'
import type {
  ExtractTableContextData,
  ExtractTablePageContextData,
  ExtractTableRow,
  TableLayout,
  TablePaginationState,
  TableSortingDirection,
  TableSortingRule,
} from './utils'

export type PublicTableQueryState = {
  layout: TableLayout
  pagination: TablePaginationState
  sorting: { sortKey: string; sortDirection: 'asc' | 'desc' } | null
  filters: TableFilterState
}

export interface TableOffsetPaginationApi {
  mode: 'offset'
  state: ComputedRef<{
    mode: 'offset'
    pageIndex: number
    pageSize: number
    pageCount: number
    loadedCount: number
    totalCount: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }>
  pageSizeOptions: ComputedRef<number[]>
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  next: () => void
  previous: () => void
  reset: () => void
}

export interface TableCursorPaginationApi {
  mode: 'cursor'
  state: ComputedRef<{
    mode: 'cursor'
    loadedCount: number
    totalCount: number | null
    hasNextPage: boolean
    isLoadingMore: boolean
    loadMoreError: unknown
  }>
  loadMore: () => Promise<unknown>
  reset: () => void
}

export interface TableNoPaginationApi {
  mode: 'none'
  state: ComputedRef<{
    mode: 'none'
    loadedCount: number
    totalCount: number | null
  }>
  reset: () => void
}

export type TablePaginationApi<TSchema> = TSchema extends { pagination: false }
  ? TableNoPaginationApi
  : TSchema extends { pagination: { mode: 'cursor' } }
    ? TableCursorPaginationApi
    : TableOffsetPaginationApi

export interface TableApi<TSchema = TableSchemaView> {
  state: {
    layout: ComputedRef<TableLayout>
    query: ComputedRef<PublicTableQueryState>
    initialized: ComputedRef<boolean>
    isEmpty: ComputedRef<boolean>
    isLoading: ComputedRef<boolean>
    isRefreshing: ComputedRef<boolean>
  }
  data: {
    rows: ComputedRef<ExtractTableRow<TSchema>[]>
    rowCount: ComputedRef<number | null>
    loadedRowCount: ComputedRef<number>
    totalRowCount: ComputedRef<number | null>
    rawRows: ComputedRef<ExtractTableRow<TSchema>[]>
    rawRowCount: ComputedRef<number | null>
    context: ComputedRef<ExtractTableContextData<TSchema>>
    pageContext: ComputedRef<ExtractTablePageContextData<TSchema>>
    requestContext: ReturnType<typeof useTableData>['requestContext']
    error: ReturnType<typeof useTableData>['error']
    status: ReturnType<typeof useTableData>['status']
    refresh: ReturnType<ReturnType<typeof useTableData>['refreshData']>
    updateRow: (row: ExtractTableRow<TSchema>) => void
    updateRows: (rows: ExtractTableRow<TSchema>[]) => void
  }
  layout: {
    state: ComputedRef<{ active: TableLayout; available: TableLayout[] }>
    set: (layout: TableLayout) => void
  }
  filters: {
    state: ComputedRef<TableFilterState>
    search: WritableComputedRef<string>
    activeCount: ComputedRef<number>
    clear: () => void
    remove: (key: string) => void
    replace: (rules: TableFilterState['ui']) => void
  }
  pagination: TablePaginationApi<TSchema>
  sorting: {
    state: ComputedRef<{
      key?: string
      dir?: TableSortingDirection
      active: boolean
    }>
    sortKeys: ComputedRef<string[]>
    set: (sorting: TableSortingRule | null) => void
    setKey: (key?: string) => void
    setDirection: (direction: TableSortingDirection) => void
    clear: () => void
    toggle: (key: string) => void
  }
  selection: {
    state: ComputedRef<{
      selectedKeys: string[]
      selectedCount: number
      allSelected: boolean
      partiallySelected: boolean
    }>
    clear: () => void
    selectAll: () => void
    selectRows: (rowIds: string[]) => void
    unselectRows: (rowIds: string[]) => void
    toggle: (options: { rowId: string; selected?: boolean; shiftKey?: boolean }) => void
    isSelected: (rowId: string) => boolean
  }
  reset: {
    query: () => void
    all: () => void
  }
  refresh: ReturnType<ReturnType<typeof useTableData>['refreshData']>
  updateRow: (row: ExtractTableRow<TSchema>) => void
  updateRows: (rows: ExtractTableRow<TSchema>[]) => void
}
