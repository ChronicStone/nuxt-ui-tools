import type { ComputedRef, ShallowRef } from 'vue'

import type { UseTableDataReturn } from '../../composables/use-table-data'
import type { useTableState } from '../../composables/use-table-state'
import type {
  TableApi,
  TableColumnAlign,
  TableColumnPinned,
  GenericObject,
  TableLayout,
  TableSchemaView,
  TableRuntimeRecord,
  TableColumnSkeleton,
  TableColumnSummary,
} from '../../types'

export const SELECT_COLUMN_ID = '__select'
export const SELECT_COLUMN_WIDTH = 44
export const ROW_ACTIONS_COLUMN_ID = '__row-actions'
export const ROW_ACTIONS_COLUMN_WIDTH = 56

export type SchemaTableColumn = NonNullable<
  NonNullable<TableSchemaView['table']>['columns']
>[number]

export interface TableRuntimeColumn {
  id: string
  label: string
  icon?: string
  width?: number | string
  minWidth?: number | string
  maxWidth?: number | string
  align?: TableColumnAlign
  sortableKey?: string
  canHide: boolean
  defaultVisible: boolean
  configurable?: boolean
  pinned?: TableColumnPinned
  summary?: TableColumnSummary
  ellipsis?: boolean
  skeleton?: TableColumnSkeleton
  lines?: number
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
    columnSizingStart: [string, number][]
  }
  sorting: { id: string; desc: boolean }[]
}

export interface TableColumnsSelectionState {
  selectionEnabled: ComputedRef<boolean>
  allSelected: ComputedRef<boolean>
  partiallySelected: ComputedRef<boolean>
  rowSelection: ComputedRef<Record<string, boolean>>
  toggleAllRows: (params: { selected: boolean }) => void
  toggleRowSelection: (params: { rowId: string; selected?: boolean; shiftKey?: boolean }) => void
  isRowSelected: (params: { rowId: string }) => boolean
  getRowId: (params: { row: GenericObject; index?: number }) => string
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
  context: TableRuntimeRecord
  pageContext: TableRuntimeRecord
  tableApi: TableApi<unknown>
  layout: TableLayout
}

export type DataListColumnInternalKind = 'selection' | 'actions'

export interface DataListColumnMeta {
  label: string
  icon?: string
  align?: TableColumnAlign
  sortable: boolean
  sortableKey?: string
  canHide: boolean
  internal?: DataListColumnInternalKind
  ellipsis?: boolean
  skeleton?: TableColumnSkeleton
  lines?: number
  render: (params: { row: GenericObject; index: number }) => import('vue').VNodeChild
  renderHeader?: () => import('vue').VNodeChild
}

export interface DataListColumnDef {
  id: string
  size: number
  minSize: number
  maxSize: number
  enableResizing: boolean
  meta: DataListColumnMeta
}

export const DEFAULT_COLUMN_SIZE = 150
export const MIN_COLUMN_SIZE = 64
export const MAX_COLUMN_SIZE = 900
