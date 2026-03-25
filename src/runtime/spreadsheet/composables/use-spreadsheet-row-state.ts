import { shallowRef, watch, type ComputedRef } from 'vue'

import type {
  SpreadsheetColumnMatch,
  SpreadsheetDynamicColumnMatch,
  SpreadsheetParsedRow,
  SpreadsheetRowSummary,
} from '../types'
import { createSpreadsheetRowSummary, parseSpreadsheetRows } from '../utils'

export interface UseSpreadsheetRowStateParams {
  rows: ComputedRef<readonly (readonly unknown[])[]>
  contextData: ComputedRef<Record<string, unknown>>
  columnMatches: ComputedRef<readonly SpreadsheetColumnMatch[]>
  dynamicColumnMatches: ComputedRef<readonly SpreadsheetDynamicColumnMatch[]>
  refreshSources: readonly unknown[]
}

export function useSpreadsheetRowState(params: UseSpreadsheetRowStateParams) {
  const parsedRows = shallowRef<SpreadsheetParsedRow[]>([])
  const summary = shallowRef<SpreadsheetRowSummary>({
    totalRows: 0,
    validRows: 0,
    invalidRows: 0,
    issueCount: 0,
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
        rows: params.rows.value,
        matches: params.columnMatches.value,
        dynamicMatches: params.dynamicColumnMatches.value,
        context: params.contextData.value,
      })

      if (runId !== nextRunId) return

      parsedRows.value = nextRows
      summary.value = createSpreadsheetRowSummary(nextRows)
      status.value = {
        initialized: true,
        isParsing: false,
        isReady: true,
      }
    } catch (nextError) {
      if (runId !== nextRunId) return

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
    parsedRows,
    summary,
    status,
    error,
    refreshRows,
  }
}
