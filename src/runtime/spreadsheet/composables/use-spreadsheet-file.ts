import { computed, shallowRef } from 'vue'

import type { SpreadsheetFileSource, SpreadsheetWorkbook } from '../types'
import { readSpreadsheetFile, readSpreadsheetText } from '../utils'

/** The file being imported: reading, errors, and its sheets. */
export function useSpreadsheetFile() {
  const workbook = shallowRef<SpreadsheetWorkbook | null>(null)
  const reading = shallowRef<boolean>(false)
  const error = shallowRef<unknown>(null)
  let run = 0

  async function load(source: SpreadsheetFileSource, name?: string) {
    const current = (run += 1)
    reading.value = true
    error.value = null
    const fileName = name ?? (source instanceof File ? source.name : 'import.xlsx')
    try {
      const next = await readSpreadsheetFile({ name: fileName, source })
      if (current === run) workbook.value = next
    } catch (nextError) {
      if (current === run) {
        workbook.value = null
        error.value = nextError
      }
    } finally {
      if (current === run) reading.value = false
    }
  }

  function paste(text: string, name = 'clipboard.tsv') {
    run += 1
    error.value = null
    reading.value = false
    workbook.value = readSpreadsheetText({ name, text })
  }

  function clear() {
    run += 1
    workbook.value = null
    error.value = null
    reading.value = false
  }

  const sheets = computed(() =>
    (workbook.value?.sheets ?? []).map((sheet) => ({
      name: sheet.name,
      rowCount: sheet.rows.length,
    })),
  )

  return { clear, error, load, paste, reading, sheets, workbook }
}
