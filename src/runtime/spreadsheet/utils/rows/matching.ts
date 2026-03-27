import type {
  SpreadsheetDynamicCollectionDefinition,
  SpreadsheetDynamicOptionGroupsDefinition,
  SpreadsheetHeaderCell,
  SpreadsheetHeaderMatcher,
  SpreadsheetMatchDefinition,
  SpreadsheetStaticColumn,
} from '../../types'
import type {
  SpreadsheetColumnMatch,
  SpreadsheetDynamicColumnMatch,
  SpreadsheetUnmatchedColumn,
} from '../../types'
import {
  applySpreadsheetNormalization,
  isSpreadsheetColumnGroup,
  isSpreadsheetDynamicCollectionItem,
  isSpreadsheetDynamicCollectionColumn,
  isSpreadsheetDynamicOptionGroupsColumn,
  isSpreadsheetStaticColumn,
  normalizeSpreadsheetText,
} from './shared'

const defaultHeaderModifiers = ['trim', 'case-insensitive', 'accent-insensitive'] as const

function getDefaultMatchDefinition(column: SpreadsheetStaticColumn): SpreadsheetMatchDefinition {
  if (column.match) return column.match

  const from = column.from
  if (!from)
    return {
      headers: [column.key],
      prefer: 'first',
    }

  return {
    headers: Array.isArray(from) ? from : [from],
    prefer: 'first',
  }
}

function scoreHeaderMatcher(
  header: SpreadsheetHeaderCell,
  matcher: SpreadsheetHeaderMatcher,
) {
  if (typeof matcher === 'string') {
    const left = applySpreadsheetNormalization(header.text, defaultHeaderModifiers)
    const right = applySpreadsheetNormalization(matcher, defaultHeaderModifiers)
    return left === right ? 1 : null
  }

  if (matcher instanceof RegExp)
    return matcher.test(header.text) ? 0.95 : null

  return matcher({
    header: {
      index: header.index,
      text: header.text,
      normalized: normalizeSpreadsheetText(header.text),
    },
  })
}

function findHeaderMatch(
  headers: readonly SpreadsheetHeaderCell[],
  definition: SpreadsheetMatchDefinition,
  usedHeaderIndexes: ReadonlySet<number>,
) {
  const candidates = headers.flatMap((header) => {
    if (usedHeaderIndexes.has(header.index)) return []

    const scores = definition.headers
      .map((matcher) => scoreHeaderMatcher(header, matcher))
      .filter((score): score is number => score !== null)

    if (!scores.length) return []

    const bestScore = Math.max(...scores)
    if (definition.minScore !== undefined && bestScore < definition.minScore) return []

    return [{ header, score: bestScore }]
  })

  if (!candidates.length) return null
  if (definition.prefer !== 'best-score') return candidates[0]

  return candidates
    .slice()
    .sort((left, right) => {
      if (left.score !== right.score) return right.score - left.score
      return left.header.index - right.header.index
    })[0]
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

function createOptionGroupsMatchDefinition(
  column: SpreadsheetDynamicOptionGroupsDefinition<string, string, unknown>,
  source: unknown,
): SpreadsheetMatchDefinition {
  return {
    headers: getDynamicHeaderPatterns(column, source),
    prefer: 'first',
  }
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

    const match = findHeaderMatch(headers, getDefaultMatchDefinition(column), usedHeaderIndexes)
    if (!match) return []

    usedHeaderIndexes.add(match.header.index)

    return [{
      key: column.key,
      columnIndex: match.header.index,
      header: match.header,
      column,
    }]
  })

  return [...manualMatches, ...automaticMatches]
}

function matchCollectionColumn(
  column: SpreadsheetDynamicCollectionDefinition<string, 'array' | 'record'>,
  headers: readonly SpreadsheetHeaderCell[],
  reservedHeaderIndexes: Set<number>,
) {
  return column.items.flatMap((entry) => {
    if (!isSpreadsheetDynamicCollectionItem(entry)) return []

    const item = entry
    const match = findHeaderMatch(headers, item.match, reservedHeaderIndexes)
    if (!match) return []

    reservedHeaderIndexes.add(match.header.index)

    return [{
      key: column.rootKey,
      targetKey: item.id,
      columnIndex: match.header.index,
      header: match.header,
      column,
      source: item.source,
      item,
    }]
  })
}

function matchOptionGroupsColumn(
  column: SpreadsheetDynamicOptionGroupsDefinition<string, string, unknown>,
  headers: readonly SpreadsheetHeaderCell[],
  reservedHeaderIndexes: Set<number>,
) {
  const sourceItems = column.source ?? []

  return sourceItems.flatMap((source) => {
    const match = findHeaderMatch(headers, createOptionGroupsMatchDefinition(column, source), reservedHeaderIndexes)
    if (!match) return []

    reservedHeaderIndexes.add(match.header.index)

    return [{
      key: column.output.into,
      targetKey: column.targetKey?.(source) ?? column.itemKey?.(source) ?? String(match.header.index),
      columnIndex: match.header.index,
      header: match.header,
      column,
      source,
    }]
  })
}

export function matchSpreadsheetDynamicColumns(
  columns: readonly unknown[],
  headers: readonly SpreadsheetHeaderCell[],
  usedHeaderIndexes: readonly number[] = [],
): SpreadsheetDynamicColumnMatch[] {
  const reservedHeaderIndexes = new Set(usedHeaderIndexes)
  const matches: SpreadsheetDynamicColumnMatch[] = []

  for (const entry of columns) {
    if (isSpreadsheetDynamicOptionGroupsColumn(entry)) {
      matches.push(...matchOptionGroupsColumn(entry, headers, reservedHeaderIndexes))
      continue
    }

    if (isSpreadsheetDynamicCollectionColumn(entry))
      matches.push(...matchCollectionColumn(entry, headers, reservedHeaderIndexes))
  }

  return matches
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
