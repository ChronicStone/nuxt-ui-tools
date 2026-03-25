import { computed, shallowRef, watch, type ComputedRef, type Ref } from 'vue'

import type {
  SpreadsheetBinaryRef,
  SpreadsheetWorkbookData,
  SpreadsheetWorkbookSelection,
} from '../types'
import {
  getDefaultSpreadsheetSheetName,
  getSpreadsheetDataRows,
  getSpreadsheetHeaders,
  getSpreadsheetSheet,
  parseSpreadsheetWorkbook,
} from '../utils'

export interface UseSpreadsheetSourceParams {
  source: SpreadsheetBinaryRef
  fileName?: Ref<string | undefined> | ComputedRef<string | undefined>
  initialSelection?: Partial<SpreadsheetWorkbookSelection>
}

export function useSpreadsheetSource(params: UseSpreadsheetSourceParams) {
  const workbook = shallowRef<SpreadsheetWorkbookData | null>(null)
  const selection = shallowRef<SpreadsheetWorkbookSelection>({
    sheetName: params.initialSelection?.sheetName,
    headerRowIndex: params.initialSelection?.headerRowIndex ?? 0,
  })
  const status = shallowRef({
    initialized: false,
    isParsing: false,
    isReady: false,
  })
  const error = shallowRef<unknown>(null)
  let runId = 0

  const sheet = computed(() =>
    getSpreadsheetSheet(workbook.value, selection.value.sheetName),
  )
  const headers = computed(() =>
    getSpreadsheetHeaders(sheet.value, selection.value.headerRowIndex),
  )
  const rows = computed(() =>
    getSpreadsheetDataRows(sheet.value, selection.value.headerRowIndex),
  )

  async function refreshWorkbook() {
    const source = params.source.value
    const nextRunId = runId + 1
    runId = nextRunId

    if (!source) {
      workbook.value = null
      error.value = null
      status.value = {
        initialized: true,
        isParsing: false,
        isReady: false,
      }
      return
    }

    status.value = {
      initialized: true,
      isParsing: true,
      isReady: false,
    }
    error.value = null

    try {
      const nextWorkbook = await parseSpreadsheetWorkbook({
        source,
        fileName: params.fileName?.value,
      })
      if (runId !== nextRunId) return

      workbook.value = nextWorkbook
      selection.value = {
        ...selection.value,
        sheetName: selection.value.sheetName ?? getDefaultSpreadsheetSheetName(nextWorkbook),
      }
      status.value = {
        initialized: true,
        isParsing: false,
        isReady: true,
      }
    } catch (nextError) {
      if (runId !== nextRunId) return

      workbook.value = null
      error.value = nextError
      status.value = {
        initialized: true,
        isParsing: false,
        isReady: false,
      }
    }
  }

  function setSheetName(sheetName: string) {
    selection.value = {
      ...selection.value,
      sheetName,
    }
  }

  function setHeaderRowIndex(headerRowIndex: number) {
    selection.value = {
      ...selection.value,
      headerRowIndex,
    }
  }

  watch(
    () => params.source.value,
    () => {
      void refreshWorkbook()
    },
    {
      immediate: true,
    },
  )

  return {
    workbook,
    selection,
    sheet,
    headers,
    rows,
    status,
    error,
    refreshWorkbook,
    setSheetName,
    setHeaderRowIndex,
  }
}
