import { isBoolean, isFunction, isNumber, isString } from '#ui-tools/shared/utils/predicate'

import type { SpreadsheetValue } from '../types'

export type SpreadsheetDisplayLabel = string | number | (() => string | number) | undefined

export function resolveSpreadsheetDisplayLabel(value: SpreadsheetDisplayLabel, fallback: string) {
  if (isFunction(value)) return String(value())

  return value == null ? fallback : String(value)
}

export function humanizeSpreadsheetKey(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function snakeCaseSpreadsheetKey(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase()
}

export function formatSpreadsheetCell(value: SpreadsheetValue) {
  if (value == null) return '—'
  if (isString(value)) return value
  if (isNumber(value) || isBoolean(value)) return String(value)
  return JSON.stringify(value)
}
