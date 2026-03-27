export type SpreadsheetDisplayLabel = string | number | (() => string | number) | undefined

export function resolveSpreadsheetDisplayLabel(
  value: SpreadsheetDisplayLabel,
  fallback: string,
) {
  if (typeof value === 'function')
    return String(value())

  return value == null ? fallback : String(value)
}

export function humanizeSpreadsheetKey(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
}

export function snakeCaseSpreadsheetKey(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase()
}

export function formatSpreadsheetCell(value: unknown) {
  if (value == null) return '—'
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value)
}
