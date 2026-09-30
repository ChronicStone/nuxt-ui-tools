import { computed, shallowRef, watch } from 'vue'
import type { ComputedRef } from 'vue'

import type { SpreadsheetPreviewRow, SpreadsheetRuntimeSchema } from '../types'
import { createSpreadsheetHeaderCells, detectSpreadsheetLayout } from '../utils'
import type { useSpreadsheetContext } from './use-spreadsheet-context'
import type { useSpreadsheetFields } from './use-spreadsheet-fields'
import type { useSpreadsheetFile } from './use-spreadsheet-file'

export interface UseSpreadsheetLayoutParams {
  schema: ComputedRef<SpreadsheetRuntimeSchema>
  file: ReturnType<typeof useSpreadsheetFile>
  fields: ReturnType<typeof useSpreadsheetFields>
  context: ReturnType<typeof useSpreadsheetContext>
}

/**
 * The sheet and header row read. Detection runs on each new file and applies the schema's `sheet`
 * and `headerRow`; the user can change both.
 */
export function useSpreadsheetLayout(params: UseSpreadsheetLayoutParams) {
  const selection = shallowRef<{ sheet: string | null; headerRow: number }>({
    headerRow: 0,
    sheet: null,
  })

  const detection = computed(() => {
    const workbook = params.file.workbook.value
    if (!workbook || !params.fields.columnFields.value.length) return null
    return detectSpreadsheetLayout({
      ctx: params.context.ctx.value,
      fields: params.fields.columnFields.value,
      workbook,
    })
  })

  function detectedSelection() {
    const workbook = params.file.workbook.value
    const definition = params.schema.value.file ?? {}
    const best = detection.value?.best
    const sheetName =
      definition.sheet && definition.sheet !== 'auto'
        ? definition.sheet
        : (best?.sheet ?? workbook?.sheets[0]?.name ?? null)
    const sheet = workbook?.sheets.find((entry) => entry.name === sheetName)
    const layout = detection.value?.sheets.find((entry) => entry.name === sheetName)
    const headerRow =
      typeof definition.headerRow === 'number'
        ? Math.max(sheet?.rowNumbers.indexOf(definition.headerRow) ?? -1, 0)
        : (layout?.headerRow ?? 0)
    return { headerRow, sheet: sheetName }
  }

  function redetect() {
    selection.value = detectedSelection()
  }

  watch(
    () => [params.file.workbook.value, detection.value !== null] as const,
    ([workbook], previous) => {
      if (!workbook) {
        selection.value = { headerRow: 0, sheet: null }
        return
      }
      if (previous?.[0] !== workbook || !previous[1]) redetect()
    },
    { immediate: true },
  )

  const sheet = computed(
    () =>
      params.file.workbook.value?.sheets.find((entry) => entry.name === selection.value.sheet) ??
      null,
  )
  const headers = computed(() =>
    createSpreadsheetHeaderCells(sheet.value?.rows[selection.value.headerRow] ?? []),
  )
  const dataRows = computed(() => sheet.value?.rows.slice(selection.value.headerRow + 1) ?? [])
  const dataRaws = computed(() => sheet.value?.raws.slice(selection.value.headerRow + 1) ?? [])
  const dataRowNumbers = computed(
    () => sheet.value?.rowNumbers.slice(selection.value.headerRow + 1) ?? [],
  )
  const candidates = computed(
    () =>
      detection.value?.sheets.find((entry) => entry.name === selection.value.sheet)?.candidates ??
      [],
  )
  const detected = computed(() => {
    const expected = detectedSelection()
    return (
      Boolean(detection.value?.best) &&
      expected.sheet === selection.value.sheet &&
      expected.headerRow === selection.value.headerRow
    )
  })
  const preview = computed<SpreadsheetPreviewRow[]>(() => {
    const rows = sheet.value?.rows ?? []
    const numbers = sheet.value?.rowNumbers ?? []
    const header = selection.value.headerRow
    const start = Math.max(0, header - 2)
    return rows.slice(start, header + 4).map((cells, offset) => {
      const index = start + offset
      return {
        cells,
        kind: index < header ? 'title' : index === header ? 'header' : 'data',
        rowNumber: numbers[index] ?? index + 1,
      }
    })
  })

  function setSheet(name: string) {
    const layout = detection.value?.sheets.find((entry) => entry.name === name)
    selection.value = { headerRow: layout?.headerRow ?? 0, sheet: name }
  }

  function setHeaderRow(index: number) {
    selection.value = { ...selection.value, headerRow: index }
  }

  return {
    candidates,
    dataRaws,
    dataRowNumbers,
    dataRows,
    detected,
    detection,
    headers,
    preview,
    redetect,
    selection,
    setHeaderRow,
    setSheet,
    sheet,
  }
}
