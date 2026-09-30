import { isPlainObject } from '#ui-tools/shared/utils/predicate'

import type { SpreadsheetRecord, SpreadsheetValue } from '../types'

export function isSpreadsheetRecord<T>(value: T): value is T & SpreadsheetRecord {
  return isPlainObject(value)
}

export function getSpreadsheetPathValue(data: SpreadsheetRecord, path: string): SpreadsheetValue {
  let current: SpreadsheetValue = data
  for (const part of path.split('.')) {
    if (!isSpreadsheetRecord(current)) return undefined
    current = current[part]
  }
  return current
}

export function setSpreadsheetPathValue(
  target: SpreadsheetRecord,
  path: string,
  value: SpreadsheetValue,
) {
  const parts = path.split('.')
  let current = target
  for (const [index, part] of parts.entries()) {
    if (index === parts.length - 1) {
      current[part] = value
      return
    }
    const next = current[part]
    if (isSpreadsheetRecord(next)) current = next
    else {
      const created: SpreadsheetRecord = {}
      current[part] = created
      current = created
    }
  }
}
