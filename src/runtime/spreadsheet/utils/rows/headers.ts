import type { SpreadsheetHeaderCell } from '../../types'
import { normalizeSpreadsheetText } from './shared'

export function createSpreadsheetHeaderCells(headers: readonly unknown[]): SpreadsheetHeaderCell[] {
  return headers.map((header, index) => ({
    index,
    raw: header,
    text: String(header ?? '').trim(),
    normalized: normalizeSpreadsheetText(header),
  }))
}
