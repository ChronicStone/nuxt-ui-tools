import { read, utils } from 'xlsx'

import type {
  SpreadsheetBinarySource,
  SpreadsheetWorkbookData,
  SpreadsheetWorkbookSheet,
} from '../../types'

async function resolveSpreadsheetBinarySource(source: SpreadsheetBinarySource) {
  if (source instanceof Uint8Array) return source
  if (source instanceof ArrayBuffer) return new Uint8Array(source)
  return new Uint8Array(await source.arrayBuffer())
}

function normalizeSheetRows(rows: unknown[][]) {
  return rows.map((row) => row.map((cell) => cell ?? ''))
}

export async function parseSpreadsheetWorkbook(params: {
  source: SpreadsheetBinarySource
  fileName?: string
}): Promise<SpreadsheetWorkbookData> {
  const data = await resolveSpreadsheetBinarySource(params.source)
  const workbook = read(data, {
    type: 'array',
    cellDates: true,
  })

  const sheets = workbook.SheetNames.map<SpreadsheetWorkbookSheet>((sheetName) => {
    const sheet = workbook.Sheets[sheetName]
    if (!sheet)
      return {
        name: sheetName,
        rows: [],
      }

    return {
      name: sheetName,
      rows: normalizeSheetRows(
        utils.sheet_to_json<unknown[]>(sheet, {
          header: 1,
          raw: false,
          defval: '',
          blankrows: false,
        }),
      ),
    }
  })

  return {
    fileName: params.fileName,
    sheets,
  }
}

export function getDefaultSpreadsheetSheetName(workbook: SpreadsheetWorkbookData | null) {
  return workbook?.sheets[0]?.name
}

export function getSpreadsheetSheet(
  workbook: SpreadsheetWorkbookData | null,
  sheetName: string | undefined,
) {
  if (!workbook) return null
  if (!sheetName) return workbook.sheets[0] ?? null
  return workbook.sheets.find((sheet) => sheet.name === sheetName) ?? workbook.sheets[0] ?? null
}

export function getSpreadsheetHeaders(
  sheet: SpreadsheetWorkbookSheet | null,
  headerRowIndex: number,
) {
  return sheet?.rows[headerRowIndex] ?? []
}

export function getSpreadsheetDataRows(
  sheet: SpreadsheetWorkbookSheet | null,
  headerRowIndex: number,
) {
  if (!sheet) return []
  return sheet.rows.slice(headerRowIndex + 1)
}
