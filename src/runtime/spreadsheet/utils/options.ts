import { isSpreadsheetRecord } from './object'

export function isSpreadsheetPrimitiveOption(value: unknown): value is string | number | boolean {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
}

export function isSpreadsheetOptionEntry(value: unknown): value is {
  label: string
  value: unknown
} {
  return isSpreadsheetRecord(value)
    && typeof value.label === 'string'
    && 'value' in value
}

export function resolveSpreadsheetOptionEntries<TParams>(
  source: unknown,
  params: TParams,
) {
  if (Array.isArray(source)) return source
  if (typeof source === 'function') return source(params)

  return []
}

export function getSpreadsheetOptionLabel(option: unknown) {
  if (isSpreadsheetPrimitiveOption(option)) return String(option)
  if (isSpreadsheetOptionEntry(option)) return option.label

  return ''
}

export function getSpreadsheetOptionValue(option: unknown) {
  if (isSpreadsheetPrimitiveOption(option)) return option
  if (isSpreadsheetOptionEntry(option)) return option.value

  return undefined
}
