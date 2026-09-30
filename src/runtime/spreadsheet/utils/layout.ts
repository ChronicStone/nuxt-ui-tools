import type {
  SpreadsheetField,
  SpreadsheetLayoutDetection,
  SpreadsheetSheetLayout,
  SpreadsheetWorkbook,
} from '../types'
import { createSpreadsheetHeaderCells, matchSpreadsheetHeaders } from './headers'

/** Rows scanned per sheet when looking for the header row. */
export const SPREADSHEET_HEADER_SCAN_ROWS = 20

/**
 * Scores the first rows of every sheet by how many fields their cells name. The best row of a
 * sheet is its header row; the best sheet wins. Title rows and empty sheets score zero.
 */
export function detectSpreadsheetLayout(params: {
  workbook: SpreadsheetWorkbook
  fields: readonly SpreadsheetField[]
  ctx: unknown
}): SpreadsheetLayoutDetection {
  const sheets = params.workbook.sheets.map<SpreadsheetSheetLayout>((sheet) => {
    const candidates = sheet.rows.slice(0, SPREADSHEET_HEADER_SCAN_ROWS).map((row, index) => ({
      index,
      matchCount: matchSpreadsheetHeaders({
        ctx: params.ctx,
        fields: params.fields,
        headers: createSpreadsheetHeaderCells(row),
      }).size,
      preview: row.filter(Boolean).slice(0, 4),
      rowNumber: sheet.rowNumbers[index] ?? index + 1,
    }))
    const best = candidates.reduce(
      (winner, candidate) => (candidate.matchCount > winner.matchCount ? candidate : winner),
      candidates[0] ?? { index: 0, matchCount: 0, preview: [], rowNumber: 1 },
    )
    return {
      candidates,
      headerRow: best.index,
      matchCount: best.matchCount,
      name: sheet.name,
      rowCount: Math.max(sheet.rows.length - best.index - 1, 0),
    }
  })
  const top = sheets.reduce<SpreadsheetSheetLayout | null>(
    (winner, sheet) => (!winner || sheet.matchCount > winner.matchCount ? sheet : winner),
    null,
  )
  const tied = top ? sheets.filter((sheet) => sheet.matchCount === top.matchCount) : []
  return {
    ambiguous: Boolean(top && top.matchCount > 0 && tied.length > 1),
    best:
      top && top.matchCount > 0
        ? { headerRow: top.headerRow, matchCount: top.matchCount, sheet: top.name }
        : null,
    sheets,
  }
}
