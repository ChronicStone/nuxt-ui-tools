import { isArray, isDate, isObject, isString } from '@nuxt-ui-tools/shared'

import type {
  GenericObject,
  TableFieldPath,
  TableResolvedFilterCondition,
  TableResolvedFilterGroup,
  TableResolvedFilterNode,
  TableSourceExecutionResult,
  TableSourceRequestContext,
  TableSortingRule,
} from '../types'

export interface TableClientQueryParams<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
> {
  rows: Iterable<TRow>
  request: TableSourceRequestContext<TRow, TContext>
  searchFields?: TableFieldPath<TRow>[]
}

export function executeClientQuery<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
>(params: TableClientQueryParams<TRow, TContext>): TableSourceExecutionResult<TRow> {
  let result = lazyFilterRows(params.rows, {
    filters: params.request.filters,
    search: params.request.search,
    searchFields: params.searchFields ?? [],
  })

  result = lazySortRows(result, params.request.sorting)

  return paginateRows(result, params.request.pagination)
}

function* lazyFilterRows<TRow extends GenericObject>(
  rows: Iterable<TRow>,
  params: {
    filters: TableResolvedFilterGroup<string>
    search: string
    searchFields: TableFieldPath<TRow>[]
  },
): Generator<TRow> {
  for (const row of rows) {
    if (
      matchesSearch(row, params.search, params.searchFields) &&
      matchesFilterNode(row, params.filters)
    ) {
      yield row
    }
  }
}

function matchesSearch<TRow extends GenericObject>(
  row: TRow,
  search: string,
  searchFields: TableFieldPath<TRow>[],
): boolean {
  if (!search.trim().length || !searchFields.length) {
    return true
  }

  return searchFields.some((field) => pathMatchesSearchValue(row, String(field), search))
}

function pathMatchesSearchValue(value: unknown, path: string, search: string): boolean {
  const segments = path.split('.')
  return matchSearchPathSegments(value, segments, search)
}

function matchSearchPathSegments(value: unknown, segments: string[], search: string): boolean {
  if (segments.length === 0) {
    return valueMatchesSearch(value, search)
  }

  if (isArray(value)) {
    return value.some((item) => matchSearchPathSegments(item, segments, search))
  }

  if (!isObject(value)) {
    return false
  }

  const [head, ...tail] = segments
  if (!head || !(head in value)) {
    return false
  }

  return matchSearchPathSegments((value as Record<string, unknown>)[head], tail, search)
}

function valueMatchesSearch(value: unknown, search: string): boolean {
  const normalizedSearch = normalizeString(search)

  if (isArray(value)) {
    return value.some((item) => valueMatchesSearch(item, normalizedSearch))
  }

  return normalizeString(value).includes(normalizedSearch)
}

function* lazySortRows<TRow extends GenericObject>(
  rows: Iterable<TRow>,
  sorting: TableSortingRule[] = [],
): Generator<TRow> {
  if (!sorting.length) {
    yield* rows
    return
  }

  const buffer: TRow[] = []
  const iterator = rows[Symbol.iterator]()
  const compare = createRowComparator<TRow>(sorting)

  while (buffer.length < 1000) {
    const next = iterator.next()
    if (next.done) {
      break
    }

    buffer.push(next.value)
  }

  buffer.sort(compare)

  while (buffer.length > 0) {
    const nextRow = buffer.shift()
    if (nextRow) {
      yield nextRow
    }

    while (buffer.length < 1000) {
      const next = iterator.next()
      if (next.done) {
        break
      }

      const insertIndex = findInsertIndex(buffer, next.value, compare)
      buffer.splice(insertIndex, 0, next.value)
    }
  }
}

function createRowComparator<TRow extends GenericObject>(
  sorting: TableSortingRule[],
): (left: TRow, right: TRow) => number {
  return (left, right) => {
    for (const rule of sorting) {
      const direction = rule.dir === 'desc' ? -1 : 1
      const comparison = compareUnknownValues(
        getFilterTargetValue(left, rule.key),
        getFilterTargetValue(right, rule.key),
      )

      if (comparison !== 0) {
        return comparison * direction
      }
    }

    return 0
  }
}

function findInsertIndex<TRow>(
  rows: TRow[],
  value: TRow,
  compare: (left: TRow, right: TRow) => number,
): number {
  let low = 0
  let high = rows.length

  while (low < high) {
    const mid = Math.floor((low + high) / 2)

    if (compare(value, rows[mid] as TRow) < 0) {
      high = mid
      continue
    }

    low = mid + 1
  }

  return low
}

function paginateRows<TRow extends GenericObject>(
  rows: Iterable<TRow>,
  pagination: TableSourceRequestContext<TRow>['pagination'],
): TableSourceExecutionResult<TRow> {
  const allRows = Array.from(rows)
  const rowCount = allRows.length
  const pageIndex = Math.max(1, pagination.pageIndex || 1)
  const pageSize = Math.max(1, pagination.pageSize || rowCount || 1)
  const start = (pageIndex - 1) * pageSize
  const end = start + pageSize

  return {
    rows: allRows.slice(start, end),
    rowCount,
  }
}

function matchesFilterNode<TRow extends GenericObject>(
  row: TRow,
  node: TableResolvedFilterNode<string>,
): boolean {
  if (node.type === 'group') {
    if (!node.children.length) {
      return true
    }

    return node.combinator === 'and'
      ? node.children.every((child) => matchesFilterNode(row, child))
      : node.children.some((child) => matchesFilterNode(row, child))
  }

  return matchesFilterCondition(row, node)
}

function matchesFilterCondition<TRow extends GenericObject>(
  row: TRow,
  condition: TableResolvedFilterCondition<string>,
): boolean {
  const value = getFilterTargetValue(row, condition.key)

  switch (condition.operator) {
    case 'contains':
      return matchContains(value, condition.value)
    case 'is':
      return matchIs(value, condition.value)
    case 'isAnyOf':
      return matchIsAnyOf(value, condition.value)
    case 'isNot':
      return !matchIs(value, condition.value)
    case 'gt':
      return matchComparison(value, condition.value, 'gt')
    case 'gte':
      return matchComparison(value, condition.value, 'gte')
    case 'lt':
      return matchComparison(value, condition.value, 'lt')
    case 'lte':
      return matchComparison(value, condition.value, 'lte')
    case 'between':
      return matchBetween(value, condition.value)
    case 'before':
      return matchComparison(value, condition.value, 'lt')
    case 'after':
      return matchComparison(value, condition.value, 'gt')
    default:
      return false
  }
}

function getFilterTargetValue(source: unknown, key: string): unknown {
  return key.split('.').reduce<unknown>((current, segment) => {
    if (isArray(current)) {
      return current.map((item) =>
        item != null && typeof item === 'object'
          ? (item as Record<string, unknown>)[segment]
          : undefined,
      )
    }

    if (!current || typeof current !== 'object') {
      return undefined
    }

    return (current as Record<string, unknown>)[segment]
  }, source)
}

function matchContains(value: unknown, filter: unknown): boolean {
  const needle = normalizeString(filter)

  if (!needle.length) {
    return true
  }

  return toValueList(value).some((item) => normalizeString(item).includes(needle))
}

function matchIs(value: unknown, filter: unknown): boolean {
  return toValueList(value).some((item) => areEqual(item, filter))
}

function matchIsAnyOf(value: unknown, filter: unknown): boolean {
  if (!isArray(filter)) {
    return matchIs(value, filter)
  }

  return filter.some((candidate) => matchIs(value, candidate))
}

function matchBetween(value: unknown, filter: unknown): boolean {
  if (!isObject(filter)) {
    return false
  }

  const from =
    'from' in filter ? normalizeComparable((filter as Record<string, unknown>).from) : null
  const to = 'to' in filter ? normalizeComparable((filter as Record<string, unknown>).to) : null

  return toValueList(value).some((item) => {
    const comparable = normalizeComparable(item)

    if (comparable == null) {
      return false
    }

    if (from != null && comparable < from) {
      return false
    }

    if (to != null && comparable > to) {
      return false
    }

    return true
  })
}

function matchComparison(
  value: unknown,
  filter: unknown,
  operator: 'gt' | 'gte' | 'lt' | 'lte',
): boolean {
  const expected = normalizeComparable(filter)
  if (expected == null) {
    return false
  }

  return toValueList(value).some((item) => {
    const comparable = normalizeComparable(item)

    if (comparable == null) {
      return false
    }

    switch (operator) {
      case 'gt':
        return comparable > expected
      case 'gte':
        return comparable >= expected
      case 'lt':
        return comparable < expected
      case 'lte':
        return comparable <= expected
    }
  })
}

function toValueList(value: unknown): unknown[] {
  if (!isArray(value)) {
    return [value]
  }

  return value.flatMap((item) => (isArray(item) ? toValueList(item) : [item]))
}

function areEqual(left: unknown, right: unknown): boolean {
  if (isDate(left) || isDate(right)) {
    const leftValue = normalizeComparable(left)
    const rightValue = normalizeComparable(right)
    return leftValue != null && leftValue === rightValue
  }

  return left === right
}

function compareUnknownValues(left: unknown, right: unknown): number {
  const leftComparable = normalizeComparableForSort(left)
  const rightComparable = normalizeComparableForSort(right)

  if (leftComparable == null && rightComparable == null) {
    return 0
  }

  if (leftComparable == null) {
    return 1
  }

  if (rightComparable == null) {
    return -1
  }

  if (typeof leftComparable === 'string' && typeof rightComparable === 'string') {
    return leftComparable.localeCompare(rightComparable, undefined, {
      numeric: true,
      sensitivity: 'base',
    })
  }

  if (leftComparable === rightComparable) {
    return 0
  }

  return leftComparable < rightComparable ? -1 : 1
}

function normalizeComparableForSort(value: unknown): number | string | null {
  if (isArray(value)) {
    return normalizeComparableForSort(value[0])
  }

  if (isDate(value)) {
    return value.getTime()
  }

  if (typeof value === 'number') {
    return Number.isNaN(value) ? null : value
  }

  if (typeof value === 'boolean') {
    return value ? 1 : 0
  }

  if (isString(value)) {
    return value.toLocaleLowerCase()
  }

  if (value == null) {
    return null
  }

  return String(value).toLocaleLowerCase()
}

function normalizeComparable(value: unknown): number | string | null {
  if (isDate(value)) {
    return value.getTime()
  }

  if (typeof value === 'number') {
    return Number.isNaN(value) ? null : value
  }

  if (typeof value === 'string') {
    const maybeTimestamp = Date.parse(value)

    if (!Number.isNaN(maybeTimestamp) && /\d{4}-\d{2}-\d{2}/.test(value)) {
      return maybeTimestamp
    }

    return value.toLocaleLowerCase()
  }

  if (typeof value === 'boolean') {
    return value ? 1 : 0
  }

  return null
}

function normalizeString(value: unknown): string {
  if (value == null) {
    return ''
  }

  return String(value).toLocaleLowerCase()
}
