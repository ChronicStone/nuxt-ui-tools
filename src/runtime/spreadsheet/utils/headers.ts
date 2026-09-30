import { isFunction, isString } from '#ui-tools/shared/utils/predicate'

import type { SpreadsheetField, SpreadsheetHeaderCell, SpreadsheetHeaderMatcher } from '../types'
import { normalizeSpreadsheetText } from './text'

export function createSpreadsheetHeaderCells(row: readonly string[]): SpreadsheetHeaderCell[] {
  return row.map((text, index) => ({ index, normalized: normalizeSpreadsheetText(text), text }))
}

function matchesHeader(
  matcher: SpreadsheetHeaderMatcher,
  header: SpreadsheetHeaderCell,
  ctx: unknown,
) {
  if (isString(matcher)) return normalizeSpreadsheetText(matcher) === header.normalized
  if (matcher instanceof RegExp) {
    matcher.lastIndex = 0
    return matcher.test(header.text)
  }
  return isFunction(matcher) ? matcher({ ctx, header }) : false
}

/** Whether a header is one of the field's declared names. */
export function isSpreadsheetHeaderOf(
  field: SpreadsheetField,
  header: SpreadsheetHeaderCell,
  ctx: unknown,
) {
  return (
    Boolean(header.normalized) &&
    field.headers.some((matcher) => matchesHeader(matcher, header, ctx))
  )
}

/**
 * Assigns a column to each field that reads its own column. Choices made by the user come first
 * (`null` leaves the field out); then each field takes the first free header that is one of its
 * names. Nothing is guessed.
 */
export function matchSpreadsheetHeaders(params: {
  fields: readonly SpreadsheetField[]
  headers: readonly SpreadsheetHeaderCell[]
  ctx: unknown
  manual?: Readonly<Record<string, number | null>>
}) {
  const matches = new Map<string, number>()
  const used = new Set<number>()
  const manual = params.manual ?? {}
  for (const [path, index] of Object.entries(manual)) {
    if (index === null || used.has(index)) continue
    matches.set(path, index)
    used.add(index)
  }
  for (const field of params.fields) {
    if (field.select?.from || field.path in manual) continue
    const header = params.headers.find(
      (candidate) =>
        !used.has(candidate.index) && isSpreadsheetHeaderOf(field, candidate, params.ctx),
    )
    if (!header) continue
    matches.set(field.path, header.index)
    used.add(header.index)
  }
  return matches
}
