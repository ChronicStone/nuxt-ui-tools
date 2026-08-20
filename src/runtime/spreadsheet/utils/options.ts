import { isBoolean, isFunction, isNumber, isString } from '#ui-tools/shared/utils/predicate'

import type { SpreadsheetValue } from '../types'
import { isSpreadsheetRecord } from './object'

export type SpreadsheetOptionEntry = { label: string; value: SpreadsheetValue }

type SpreadsheetOptionResolver<TParams> = (params: TParams) => readonly SpreadsheetValue[]

function isSpreadsheetOptionResolver<TParams>(
  value: SpreadsheetValue,
): value is SpreadsheetOptionResolver<TParams> {
  return isFunction(value)
}

export function isSpreadsheetPrimitiveOption<T>(
  value: T,
): value is T & (string | number | boolean) {
  return isString(value) || isNumber(value) || isBoolean(value)
}

export function isSpreadsheetOptionEntry<T>(value: T): value is T & SpreadsheetOptionEntry {
  return isSpreadsheetRecord(value) && 'label' in value && isString(value.label) && 'value' in value
}

export function resolveSpreadsheetOptionEntries<TParams>(
  source: SpreadsheetValue,
  params: TParams,
): readonly SpreadsheetValue[] {
  if (Array.isArray(source)) return source
  if (isSpreadsheetOptionResolver<TParams>(source)) return source(params)

  return []
}

export function getSpreadsheetOptionLabel<T>(option: T) {
  if (isSpreadsheetPrimitiveOption(option)) return String(option)
  if (isSpreadsheetOptionEntry(option)) return option.label

  return ''
}

export function getSpreadsheetOptionValue<T>(option: T): SpreadsheetValue | undefined {
  if (isSpreadsheetPrimitiveOption(option)) return option
  if (isSpreadsheetOptionEntry(option)) return option.value

  return undefined
}
