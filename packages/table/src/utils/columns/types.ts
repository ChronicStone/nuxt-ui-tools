import type { Ref } from 'vue'

import type { TableColumn, TableLayout } from '../../types'

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

export interface UseTableColumnsParams {
  schema: any
  data: any
  query: any
  api: any
  selection: any
  tableLayout: any
  tableState: Ref<TableColumnState>
}

export interface TableColumnRenderParams {
  column: TableColumn
  row: Record<string, any>
  params: UseTableColumnsParams
}

export interface TableCellRenderContext {
  row: Record<string, any>
  index: number
  context: Record<string, any>
  pageContext: Record<string, any>
  layout: TableLayout
}
