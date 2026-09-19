import { isBoolean, isFunction, isNumber, isString } from '#ui-tools/shared/utils/predicate'

import { isNullish } from '../../shared/utils/predicate'
import type { SpreadsheetValue } from '../types'

export type SpreadsheetDisplayLabel = string | number | (() => string | number) | undefined

export function resolveSpreadsheetDisplayLabel(value: SpreadsheetDisplayLabel, fallback: string) {
  if (isFunction(value)) {
    return String(value())
  }

  return isNullish(value) ? fallback : String(value)
}

export function humanizeSpreadsheetKey(value: string) {
  return value
    .replaceAll(/([a-z0-9])([A-Z])/gu, '$1 $2')
    .replaceAll(/[_-]+/gu, ' ')
    .replaceAll(/\b\w/gu, (char) => char.toUpperCase())
}

export function snakeCaseSpreadsheetKey(value: string) {
  return value
    .replaceAll(/([a-z0-9])([A-Z])/gu, '$1_$2')
    .replaceAll(/[\s-]+/gu, '_')
    .toLowerCase()
}

export function formatSpreadsheetCell(value: SpreadsheetValue) {
  if (isNullish(value)) {
    return '—'
  }
  if (isString(value)) {
    return value
  }
  if (isNumber(value) || isBoolean(value)) {
    return String(value)
  }
  return JSON.stringify(value)
}
