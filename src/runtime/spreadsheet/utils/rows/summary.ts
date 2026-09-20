import type { SpreadsheetParsedRow, SpreadsheetRowSummary } from '../../types'

export function createSpreadsheetRowSummary(
  rows: readonly SpreadsheetParsedRow[],
): SpreadsheetRowSummary {
  const invalidRows = rows.filter((row) => !row.isValid).length
  const issueCount = rows.reduce((total, row) => total + row.issues.length, 0)

  return {
    invalidRows,
    issueCount,
    totalRows: rows.length,
    validRows: rows.length - invalidRows,
  }
}
