import { shallowRef, watch } from 'vue'
import type { ComputedRef } from 'vue'

import type {
  SpreadsheetColumnMatch,
  SpreadsheetDynamicColumnMatch,
  SpreadsheetParsedRow,
  SpreadsheetRecord,
  SpreadsheetRowSummary,
} from '../types'
import { createSpreadsheetRowSummary, parseSpreadsheetRows } from '../utils'

export interface UseSpreadsheetRowStateParams {
  rows: ComputedRef<readonly (readonly unknown[])[]>
  contextData: ComputedRef<SpreadsheetRecord>
  columnMatches: ComputedRef<readonly SpreadsheetColumnMatch[]>
  dynamicColumnMatches: ComputedRef<readonly SpreadsheetDynamicColumnMatch[]>
  refreshSources: readonly unknown[]
}

export function useSpreadsheetRowState(params: UseSpreadsheetRowStateParams) {
  const parsedRows = shallowRef<SpreadsheetParsedRow[]>([])
  const summary = shallowRef<SpreadsheetRowSummary>({
    invalidRows: 0,
    issueCount: 0,
    totalRows: 0,
    validRows: 0,
  })
  const status = shallowRef({
    initialized: false,
    isParsing: false,
    isReady: false,
  })
  const error = shallowRef<unknown>(null)
  let runId = 0

  async function refreshRows() {
    const nextRunId = runId + 1
    runId = nextRunId
    status.value = {
      initialized: true,
      isParsing: true,
      isReady: false,
    }
    error.value = null

    try {
      const nextRows = await parseSpreadsheetRows({
        context: params.contextData.value,
        dynamicMatches: params.dynamicColumnMatches.value,
        matches: params.columnMatches.value,
        rows: params.rows.value,
      })

      if (runId !== nextRunId) {
        return
      }

      parsedRows.value = nextRows
      summary.value = createSpreadsheetRowSummary(nextRows)
      status.value = {
        initialized: true,
        isParsing: false,
        isReady: true,
      }
    } catch (nextError) {
      if (runId !== nextRunId) {
        return
      }

      parsedRows.value = []
      summary.value = createSpreadsheetRowSummary([])
      status.value = {
        initialized: true,
        isParsing: false,
        isReady: false,
      }
      error.value = nextError
    }
  }

  watch(
    params.refreshSources,
    () => {
      void refreshRows()
    },
    {
      immediate: true,
    },
  )

  return {
    error,
    parsedRows,
    refreshRows,
    status,
    summary,
  }
}
