import type {
  SpreadsheetParsedRow,
} from '../../types'
import { getSpreadsheetValueAtPath } from '../object'
import { isSpreadsheetReferenceDefinition } from './guards'

export function collectSpreadsheetReferenceTokens(value: unknown) {
  const items = Array.isArray(value) ? value : [value]
  const tokens: string[] = []

  for (const item of items) {
    const token = String(item ?? '').trim()
    if (!token) continue
    if (tokens.includes(token)) continue
    tokens.push(token)
  }

  return tokens
}

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
      for (const sourceValue of collectSpreadsheetReferenceTokens(rawValue)) {
        const rowIndexes = entries.get(sourceValue) ?? []
        entries.set(sourceValue, [...rowIndexes, row.index])
      }
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
