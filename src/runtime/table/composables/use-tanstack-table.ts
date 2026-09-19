import {
  columnPinningFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createCoreRowModel,
  functionalUpdate,
  tableFeatures,
  useTable as useTanstack,
} from '@tanstack/vue-table'
import type { ColumnDef, columnResizingState } from '@tanstack/vue-table'
import { ref, type ComputedRef, type Ref } from 'vue'

import type { GenericObject } from '../types'
import type { DataListColumnDef, DataListColumnMeta } from '../utils/columns/types'

const dataListFeatures = tableFeatures({
  columnPinningFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  coreRowModel: createCoreRowModel(),
  // SAFETY: TanStack requires a seed value for the feature metadata slot; every column def supplies the full meta contract.
  columnMeta: {} as DataListColumnMeta,
})

export type DataListTableFeatures = typeof dataListFeatures

const BLANK_RESIZING: columnResizingState = {
  columnSizingStart: [],
  deltaOffset: null,
  deltaPercentage: null,
  isResizingColumn: false,
  startOffset: null,
  startSize: null,
}

export interface UseTanstackTableParams {
  columns: ComputedRef<DataListColumnDef[]>
  data: ComputedRef<GenericObject[]>
  getRowId: (row: GenericObject, index: number) => string
  pinned: ComputedRef<{ start: string[]; end: string[] }>
  columnSizing: Ref<Record<string, number>>
}

export function useTanstackTable(params: UseTanstackTableParams) {
  const columnResizing = ref<columnResizingState>({ ...BLANK_RESIZING })

  const table = useTanstack({
    get columns() {
      // SAFETY: DataListColumnDef mirrors the TanStack definition at this single adapter boundary.
      return params.columns.value as unknown as ColumnDef<DataListTableFeatures, GenericObject>[]
    },
    get data() {
      return params.data.value
    },
    features: dataListFeatures,
    columnResizeMode: 'onChange',
    enableColumnResizing: true,
    getRowId: (row: GenericObject, index: number) => params.getRowId(row, index),
    state: {
      get columnPinning() {
        return params.pinned.value
      },
      get columnResizing() {
        return columnResizing.value
      },
      get columnSizing() {
        return params.columnSizing.value
      },
    },
    onColumnSizingChange: (updater) => {
      params.columnSizing.value = functionalUpdate(updater, params.columnSizing.value)
    },
    onColumnResizingChange: (updater) => {
      columnResizing.value = functionalUpdate(updater, columnResizing.value)
    },
  })

  function resetColumnSizing() {
    params.columnSizing.value = {}
  }

  return { table, columnResizing, resetColumnSizing }
}
