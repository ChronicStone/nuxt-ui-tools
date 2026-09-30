/**
 * Text used for exact matching: no case, no accents, one space between words, and no trailing
 * `*` or `(required)` marker. Two values match when their normalized texts are equal.
 */
export function normalizeSpreadsheetText(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replaceAll(/[̀-ͯ]/gu, '')
    .replaceAll(/\s*\*\s*$/gu, '')
    .replaceAll(/\s*\(required\)\s*$/giu, '')
    .replaceAll(/\s+/gu, ' ')
    .trim()
    .toLowerCase()
}

/** Cell text as displayed: trimmed, empty for `null` and `undefined`. */
export function toSpreadsheetText(value: unknown) {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? '' : value.toISOString()
  return String(value).trim()
}

/** Splits a cell into its items, trimmed, without empty ones. */
export function splitSpreadsheetItems(text: string, separator: string) {
  return text
    .split(separator)
    .map((item) => item.trim())
    .filter(Boolean)
}
