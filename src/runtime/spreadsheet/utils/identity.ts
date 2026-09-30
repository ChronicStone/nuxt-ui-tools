import type { SpreadsheetExistingAction, SpreadsheetRecord, SpreadsheetRowKey } from '../types'
import { isSpreadsheetKeyTuple } from './guards'
import { getSpreadsheetPathValue, isSpreadsheetRecord } from './paths'
import { toSpreadsheetText } from './text'

function isRowKey(value: unknown): value is SpreadsheetRowKey {
  if (typeof value === 'string') return value.trim() !== ''
  if (typeof value === 'number') return Number.isFinite(value)
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (part) => (typeof part === 'string' && part.trim() !== '') || typeof part === 'number',
    )
  )
}

/** Text form of a row key, used to compare keys; `null` when the key is empty. */
export function serializeSpreadsheetRowKey(value: unknown) {
  if (!isRowKey(value)) return null
  if (isSpreadsheetKeyTuple(value))
    return JSON.stringify(value.map((part) => normalizeKeyPart(part)))
  return normalizeKeyPart(value)
}

function normalizeKeyPart(value: string | number) {
  return typeof value === 'number' ? String(value) : value.trim().toLowerCase()
}

/**
 * Field paths a key function reads, found by running it on a recording copy of a row. Duplicate
 * issues are attached to these cells.
 */
export function detectSpreadsheetKeyFields(
  key: (row: SpreadsheetRecord) => unknown,
  sample: SpreadsheetRecord,
) {
  const paths = new Set<string>()
  function record(target: SpreadsheetRecord, prefix: string): SpreadsheetRecord {
    return new Proxy(target, {
      get(object, property) {
        if (typeof property !== 'string') return undefined
        const path = prefix ? `${prefix}.${property}` : property
        const value = object[property]
        if (isSpreadsheetRecord(value)) return record(value, path)
        paths.add(path)
        return value
      },
    })
  }
  try {
    key(record(sample, ''))
  } catch {
    // A key reading a field that is empty in the sample row still reports the paths it read.
  }
  return [...paths]
}

/** Fields of a row whose value differs from the stored record, for the fields the record has. */
export function diffSpreadsheetRow(params: {
  paths: readonly string[]
  data: SpreadsheetRecord
  existing: unknown
}) {
  if (!isSpreadsheetRecord(params.existing)) return []
  const existing = params.existing
  return params.paths.filter((path) => {
    const stored = getSpreadsheetPathValue(existing, path)
    if (stored === undefined) return false
    return format(stored) !== format(getSpreadsheetPathValue(params.data, path))
  })
}

function format(value: unknown): string {
  if (Array.isArray(value)) return value.map(format).join(', ')
  return toSpreadsheetText(value)
}

export function resolveSpreadsheetExistingAction(params: {
  action:
    | SpreadsheetExistingAction
    | ((params: {
        row: SpreadsheetRecord
        existing: unknown
        ctx: unknown
      }) => SpreadsheetExistingAction)
    | undefined
  row: SpreadsheetRecord
  existing: unknown
  ctx: unknown
}): SpreadsheetExistingAction {
  if (!params.action) return 'update'
  if (typeof params.action === 'string') return params.action
  return params.action({ ctx: params.ctx, existing: params.existing, row: params.row })
}
