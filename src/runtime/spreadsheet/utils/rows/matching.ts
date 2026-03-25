import type { SpreadsheetDynamicOptionGroupsDefinition } from '../../types'
import type {
  SpreadsheetColumnMatch,
  SpreadsheetDynamicColumnMatch,
  SpreadsheetHeaderCell,
  SpreadsheetStaticColumn,
  SpreadsheetUnmatchedColumn,
} from '../../types'
import {
  applySpreadsheetNormalization,
  isSpreadsheetColumnGroup,
  isSpreadsheetDynamicOptionGroupsColumn,
  isSpreadsheetStaticColumn,
  normalizeSpreadsheetText,
} from './shared'

function getColumnPatterns(column: SpreadsheetStaticColumn) {
  if (!column.from) return [column.key]
  if (Array.isArray(column.from)) return column.from
  return [column.from]
}

function getDynamicHeaderPatterns(
  column: SpreadsheetDynamicOptionGroupsDefinition<string, string, unknown>,
  source: unknown,
) {
  const label = column.itemLabel?.(source) ?? column.itemKey?.(source) ?? column.key
  const strategy = column.header?.strategy ?? 'exact'

  if (strategy === 'template' && column.header?.template)
    return [column.header.template({ source })]

  if (strategy === 'patterns' && column.header?.patterns)
    return column.header.patterns({ source })

  return [label]
}

function isSpreadsheetColumnMatch(
  header: SpreadsheetHeaderCell,
  pattern: string | RegExp,
) {
  if (typeof pattern === 'string')
    return header.normalized === normalizeSpreadsheetText(pattern)

  return pattern.test(header.text)
}

function isSpreadsheetDynamicHeaderMatch(
  header: SpreadsheetHeaderCell,
  pattern: string | RegExp,
  normalize: readonly string[] | undefined,
) {
  if (typeof pattern === 'string')
    return applySpreadsheetNormalization(header.text, normalize)
      === applySpreadsheetNormalization(pattern, normalize)

  return pattern.test(header.text)
}

export function flattenSpreadsheetStaticColumns(
  entries: readonly unknown[],
): SpreadsheetStaticColumn[] {
  return entries.flatMap((entry) => {
    if (isSpreadsheetColumnGroup(entry))
      return flattenSpreadsheetStaticColumns(entry.columns)

    if (isSpreadsheetStaticColumn(entry))
      return [entry]

    return []
  })
}

export function matchSpreadsheetColumns(
  columns: readonly SpreadsheetStaticColumn[],
  headers: readonly SpreadsheetHeaderCell[],
  manualAssignments: Readonly<Record<string, string>> = {},
): SpreadsheetColumnMatch[] {
  const usedHeaderIndexes = new Set<number>()
  const matchedKeys = new Set<string>()
  const manualMatches = Object.entries(manualAssignments)
    .map(([headerIndex, key]) => {
      const column = columns.find((entry) => entry.key === key)
      const header = headers.find((entry) => entry.index === Number(headerIndex))
      if (!column || !header) return null
      if (usedHeaderIndexes.has(header.index) || matchedKeys.has(column.key)) return null

      usedHeaderIndexes.add(header.index)
      matchedKeys.add(column.key)

      return {
        key: column.key,
        columnIndex: header.index,
        header,
        column,
      }
    })
    .filter((match): match is SpreadsheetColumnMatch => match !== null)

  const automaticMatches = columns.flatMap((column) => {
    if (matchedKeys.has(column.key)) return []

    const match = headers.find((header) => {
      if (usedHeaderIndexes.has(header.index)) return false

      return getColumnPatterns(column).some((pattern) =>
        isSpreadsheetColumnMatch(header, pattern),
      )
    })

    if (!match) return []

    usedHeaderIndexes.add(match.index)

    return [{
      key: column.key,
      columnIndex: match.index,
      header: match,
      column,
    }]
  })

  return [...manualMatches, ...automaticMatches]
}

export function matchSpreadsheetDynamicColumns(
  columns: readonly unknown[],
  headers: readonly SpreadsheetHeaderCell[],
  usedHeaderIndexes: readonly number[] = [],
): SpreadsheetDynamicColumnMatch[] {
  const reservedHeaderIndexes = new Set(usedHeaderIndexes)

  return columns.flatMap((entry) => {
    if (!isSpreadsheetDynamicOptionGroupsColumn(entry)) return []

    const column = entry
    const sourceItems = column.source ?? []

    return sourceItems.flatMap((source) => {
      const patterns = getDynamicHeaderPatterns(column, source)
      const match = headers.find((header) => {
        if (reservedHeaderIndexes.has(header.index)) return false

        return patterns.some((pattern) =>
          isSpreadsheetDynamicHeaderMatch(header, pattern, column.header?.normalize),
        )
      })

      if (!match) return []

      reservedHeaderIndexes.add(match.index)

      return [{
        key: column.key,
        targetKey: column.targetKey?.(source) ?? column.itemKey?.(source) ?? String(match.index),
        columnIndex: match.index,
        header: match,
        column,
        source,
      }]
    })
  })
}

export function getSpreadsheetUnmatchedColumns(
  columns: readonly SpreadsheetStaticColumn[],
  matches: readonly SpreadsheetColumnMatch[],
): SpreadsheetUnmatchedColumn[] {
  const matchedKeys = new Set(matches.map((match) => match.key))

  return columns.flatMap((column) =>
    matchedKeys.has(column.key)
      ? []
      : [{ key: column.key, column }],
  )
}
