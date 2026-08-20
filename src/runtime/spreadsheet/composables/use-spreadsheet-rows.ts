import type { ComputedRef } from 'vue'

import type { SpreadsheetNormalizedSchema, SpreadsheetRecord } from '../types'
import { useSpreadsheetColumnMatching } from './use-spreadsheet-column-matching'
import { useSpreadsheetRowState } from './use-spreadsheet-row-state'

export interface UseSpreadsheetRowsParams {
  schema: ComputedRef<SpreadsheetNormalizedSchema>
  contextData: ComputedRef<SpreadsheetRecord>
  headers: ComputedRef<readonly unknown[]>
  rows: ComputedRef<readonly (readonly unknown[])[]>
}

export function useSpreadsheetRows(params: UseSpreadsheetRowsParams) {
  const matching = useSpreadsheetColumnMatching({
    schema: params.schema,
    contextData: params.contextData,
    headers: params.headers,
  })
  const rowState = useSpreadsheetRowState({
    rows: params.rows,
    contextData: params.contextData,
    columnMatches: matching.columnMatches,
    dynamicColumnMatches: matching.dynamicColumnMatches,
    refreshSources: [
      params.contextData,
      params.headers,
      params.rows,
      matching.columnMatches,
      matching.manualColumnAssignments,
    ],
  })

  return {
    ...matching,
    ...rowState,
  }
}
