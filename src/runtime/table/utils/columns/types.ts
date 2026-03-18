import type { ComputedRef, Ref } from 'vue'

import type { UseTableDataReturn } from '../../composables/use-table-data'
import type {
  TableColumn,
  TableFilterState,
  TableLayout,
  TableSchemaView,
  TableSortingDirection,
} from '../../types'

export const SELECT_COLUMN_ID = '__select'
export const SELECT_COLUMN_WIDTH = 56

export interface TableRuntimeColumn {
  id: string
  label: string
  icon?: string
  sortableKey?: string
  canHide: boolean
  defaultVisible: boolean
}

export interface TableColumnState {
  columnOrder: string[]
  columnVisibility: Record<string, boolean>
  columnPinning: {
    left?: string[]
    right?: string[]
  }
  columnSizing: Record<string, number>
  columnSizingInfo: {
    startOffset: number | null
    startSize: number | null
    deltaOffset: number | null
    deltaPercentage: number | null
    isResizingColumn: false | string
    columnSizingStart: Array<[string, number]>
  }
  sorting: Array<{ id: string; desc: boolean }>
}

export interface TableColumnsSelectionState {
  selectionEnabled: ComputedRef<boolean>
  allSelected: ComputedRef<boolean>
  partiallySelected: ComputedRef<boolean>
  rowSelection: ComputedRef<Record<string, boolean>>
  toggleAllRows: (params: { selected: boolean }) => void
  toggleRowSelection: (params: { rowId: string; selected?: boolean; shiftKey?: boolean }) => void
  isRowSelected: (params: { rowId: string }) => boolean
}

export interface TablePublicQueryState {
  layout: TableLayout
  pagination: { pageIndex: number; pageSize: number }
  sorting: { sortKey: string; sortDirection: TableSortingDirection } | null
  filters: TableFilterState
}

export interface UseTableColumnsParams {
  schema: ComputedRef<TableSchemaView>
  data: Pick<UseTableDataReturn, 'contextData' | 'pageContextData'>
  query: ComputedRef<TablePublicQueryState>
  api: { setSorting: (sorting: { key: string; dir: TableSortingDirection } | null) => void }
  selection: TableColumnsSelectionState
  tableLayout: ComputedRef<TableLayout>
  tableState: Ref<TableColumnState>
}

export interface TableColumnRenderParams {
  column: TableColumn
  row: Record<string, any>
  rowIndex: number
  params: UseTableColumnsParams
}

export interface TableCellRenderContext {
  row: Record<string, any>
  index: number
  context: Record<string, any>
  pageContext: Record<string, any>
  layout: TableLayout
}
