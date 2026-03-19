import type { ComputedRef } from 'vue'

import type { useTableData } from '../composables/use-table-data'
import type { TableFilterState } from './query-state'
import type { TableSchemaView } from './schema'
import type {
  ExtractTableContextData,
  ExtractTablePageContextData,
  ExtractTableRow,
  TableLayout,
  TableSortingDirection,
  TableSortingRule,
} from './utils'

export type PublicTableQueryState = {
  layout: TableLayout
  pagination: { pageIndex: number; pageSize: number }
  sorting: { sortKey: string; sortDirection: 'asc' | 'desc' } | null
  filters: TableFilterState
}

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
    rowCount: ComputedRef<number>
    rawRows: ComputedRef<ExtractTableRow<TSchema>[]>
    rawRowCount: ComputedRef<number>
    context: ComputedRef<ExtractTableContextData<TSchema>>
    pageContext: ComputedRef<ExtractTablePageContextData<TSchema>>
    requestContext: ReturnType<typeof useTableData>['requestContext']
    error: ReturnType<typeof useTableData>['error']
    status: ReturnType<typeof useTableData>['status']
    refresh: ReturnType<ReturnType<typeof useTableData>['refreshData']>
  }
  layout: {
    state: ComputedRef<{ active: TableLayout; available: TableLayout[] }>
    set: (layout: TableLayout) => void
  }
  pagination: {
    state: ComputedRef<{
      pageIndex: number
      pageSize: number
      pageCount: number
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
}
