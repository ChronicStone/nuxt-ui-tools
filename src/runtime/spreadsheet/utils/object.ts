import { isObject } from '#ui-tools/shared/utils/predicate'

import type { SpreadsheetRecord, SpreadsheetValue } from '../types'

export function isSpreadsheetRecord<T>(value: T): value is T & SpreadsheetRecord {
  return isObject(value)
}

export function getSpreadsheetValueAtPath(
  data: SpreadsheetRecord,
  path: string,
): SpreadsheetValue | undefined {
  return path.split('.').reduce<SpreadsheetValue | undefined>((current, part) => {
    if (!isSpreadsheetRecord(current)) return undefined
    return current[part]
  }, data)
}

export function setSpreadsheetValueAtPath(
  target: SpreadsheetRecord,
  path: string,
  value: SpreadsheetValue,
): void {
  const parts = path.split('.')
  let current = target

  for (const [index, part] of parts.entries()) {
    const isLast = index === parts.length - 1
    if (isLast) {
      current[part] = value
      continue
    }

    const nextValue: SpreadsheetValue = current[part]
    if (isSpreadsheetRecord(nextValue)) {
      current = nextValue
      continue
    }

    const nextRecord: SpreadsheetRecord = {}
    current[part] = nextRecord
    current = nextRecord
  }
}

export function deleteSpreadsheetValueAtPath(target: SpreadsheetRecord, path: string): void {
  const parts = path.split('.')
  let current: SpreadsheetRecord | undefined = target

  for (const [index, part] of parts.entries()) {
    if (!current) return

    const isLast = index === parts.length - 1
    if (isLast) {
      delete current[part]
      return
    }

    const nextValue: SpreadsheetValue = current[part]
    if (!isSpreadsheetRecord(nextValue)) return
    current = nextValue
  }
}

export function getSpreadsheetObjectEntries<T>(value: T): Array<[string, SpreadsheetValue]> {
  if (!isSpreadsheetRecord(value)) return []
  return Object.entries(value)
}

export function getSpreadsheetObjectKeys<T>(value: T): string[] {
  return getSpreadsheetObjectEntries(value).map(([key]) => key)
}

export function getSpreadsheetLeafPaths<T>(value: T, prefix = ''): string[] {
  if (!isSpreadsheetRecord(value)) return prefix ? [prefix] : []

  const entries = getSpreadsheetObjectEntries(value)
  if (!entries.length) return prefix ? [prefix] : []

  return entries.flatMap(([key, entryValue]) => {
    const nextPath = prefix ? `${prefix}.${key}` : key
    if (isSpreadsheetRecord(entryValue)) return getSpreadsheetLeafPaths(entryValue, nextPath)

    return [nextPath]
  })
}

export function cloneSpreadsheetRowData(data: SpreadsheetRecord): SpreadsheetRecord {
  return structuredClone(data)
}
