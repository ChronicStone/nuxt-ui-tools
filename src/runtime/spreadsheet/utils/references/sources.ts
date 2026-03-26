import type {
  SpreadsheetParsedRow,
} from '../../types'
import { getSpreadsheetValueAtPath } from '../object'
import { isSpreadsheetReferenceDefinition } from './guards'

export function collectSpreadsheetReferenceSources(
  references: readonly unknown[],
  rows: readonly SpreadsheetParsedRow<Record<string, unknown>>[],
) {
  return references.flatMap((entry) => {
    if (!isSpreadsheetReferenceDefinition(entry)) return []

    const reference = entry
    const entries = new Map<string, number[]>()

    for (const row of rows) {
      const rawValue = getSpreadsheetValueAtPath(row.data, reference.source)
      const sourceValue = String(rawValue ?? '').trim()
      if (!sourceValue) continue

      const rowIndexes = entries.get(sourceValue) ?? []
      entries.set(sourceValue, [...rowIndexes, row.index])
    }

    return [{
      reference,
      entries: Array.from(entries.entries()).map(([value, rowIndexes]) => ({
        value,
        rowIndexes,
      })),
    }]
  })
}
