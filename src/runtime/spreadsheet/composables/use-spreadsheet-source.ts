import { computed, shallowRef, watch } from 'vue'
import type { ComputedRef, Ref } from 'vue'

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
    headerRowIndex: params.initialSelection?.headerRowIndex ?? 0,
    sheetName: params.initialSelection?.sheetName,
  })
  const status = shallowRef({
    initialized: false,
    isParsing: false,
    isReady: false,
  })
  const error = shallowRef<unknown>(null)
  let runId = 0

  const sheet = computed(() => getSpreadsheetSheet(workbook.value, selection.value.sheetName))
  const headers = computed(() => getSpreadsheetHeaders(sheet.value, selection.value.headerRowIndex))
  const rows = computed(() => getSpreadsheetDataRows(sheet.value, selection.value.headerRowIndex))

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
        fileName: params.fileName?.value,
        source,
      })
      if (runId !== nextRunId) {
        return
      }

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
      if (runId !== nextRunId) {
        return
      }

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
    error,
    headers,
    refreshWorkbook,
    rows,
    selection,
    setHeaderRowIndex,
    setSheetName,
    sheet,
    status,
    workbook,
  }
}
