import type { ComputedRef, ShallowRef } from 'vue'

import type { UseTableDataReturn } from '../../composables/use-table-data'
import type { useTableState } from '../../composables/use-table-state'
import type {
  TableApi,
  TableColumnPinned,
  GenericObject,
  TableLayout,
  TableSchemaView,
  TableSortingDirection,
} from '../../types'

export const SELECT_COLUMN_ID = '__select'
export const SELECT_COLUMN_WIDTH = 56
export const ROW_ACTIONS_COLUMN_ID = '__row-actions'
export const ROW_ACTIONS_COLUMN_WIDTH = 52

export type SchemaTableColumn = NonNullable<NonNullable<TableSchemaView['table']>['columns']>[number]

export interface TableRuntimeColumn {
  id: string
  label: string
  icon?: string
  sortableKey?: string
  canHide: boolean
  defaultVisible: boolean
  configurable?: boolean
  pinned?: TableColumnPinned
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

export interface UseTableColumnsParams {
  schema: ComputedRef<TableSchemaView>
  state: ReturnType<typeof useTableState>
  data: Pick<UseTableDataReturn, 'contextData' | 'pageContextData' | 'data'>
  selection: TableColumnsSelectionState
  tableLayout: ComputedRef<TableLayout>
  tableApi: ShallowRef<TableApi<unknown> | null>
}

export interface TableColumnRenderParams {
  column: SchemaTableColumn
  row: GenericObject
  rowIndex: number
  params: UseTableColumnsParams
}

export interface TableCellRenderContext {
  row: GenericObject
  index: number
  context: Record<string, unknown>
  pageContext: Record<string, unknown>
  tableApi: TableApi<unknown>
  layout: TableLayout
}
