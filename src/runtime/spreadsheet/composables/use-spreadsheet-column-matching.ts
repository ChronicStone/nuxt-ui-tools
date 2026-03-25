import { computed, shallowRef, type ComputedRef } from 'vue'

import type { SpreadsheetNormalizedSchema } from '../types'
import { createSpreadsheetDynamicBuilder } from '../utils/builders'
import {
  createSpreadsheetHeaderCells,
  flattenSpreadsheetStaticColumns,
  getSpreadsheetUnmatchedColumns,
  matchSpreadsheetColumns,
  matchSpreadsheetDynamicColumns,
} from '../utils'

export interface UseSpreadsheetColumnMatchingParams {
  schema: ComputedRef<SpreadsheetNormalizedSchema>
  contextData: ComputedRef<Record<string, unknown>>
  headers: ComputedRef<readonly unknown[]>
}

export function useSpreadsheetColumnMatching(params: UseSpreadsheetColumnMatchingParams) {
  const headerCells = computed(() => createSpreadsheetHeaderCells(params.headers.value))
  const staticColumns = computed(() =>
    flattenSpreadsheetStaticColumns(params.schema.value.columns.static),
  )
  const manualColumnAssignments = shallowRef<Record<string, string>>({})
  const dynamicColumns = computed(() =>
    params.schema.value.columns.dynamic({
      context: params.contextData.value,
      dynamic: createSpreadsheetDynamicBuilder(),
    }),
  )
  const columnMatches = computed(() =>
    matchSpreadsheetColumns(staticColumns.value, headerCells.value, manualColumnAssignments.value),
  )
  const dynamicColumnMatches = computed(() =>
    matchSpreadsheetDynamicColumns(
      dynamicColumns.value,
      headerCells.value,
      columnMatches.value.map((match) => match.columnIndex),
    ),
  )
  const unmatchedColumns = computed(() =>
    getSpreadsheetUnmatchedColumns(staticColumns.value, columnMatches.value),
  )

  function assignColumn(headerIndex: number, columnKey: string) {
    const nextAssignments = Object.fromEntries(
      Object.entries(manualColumnAssignments.value)
        .filter(([index, key]) => index !== String(headerIndex) && key !== columnKey),
    )

    manualColumnAssignments.value = {
      ...nextAssignments,
      [String(headerIndex)]: columnKey,
    }
  }

  function clearColumnAssignment(headerIndex: number) {
    const nextAssignments = { ...manualColumnAssignments.value }
    delete nextAssignments[String(headerIndex)]
    manualColumnAssignments.value = nextAssignments
  }

  return {
    headerCells,
    staticColumns,
    dynamicColumns,
    manualColumnAssignments,
    columnMatches,
    dynamicColumnMatches,
    unmatchedColumns,
    assignColumn,
    clearColumnAssignment,
  }
}
