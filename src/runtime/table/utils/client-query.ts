import { isArray, isDate, isObject, isString } from '../../shared/utils/predicate'
import type {
  TableFacetExecutionResult,
  TableFacetOptionResult,
  TableFacetRequestDescriptor,
  GenericObject,
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
}

export function executeClientQuery<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
>(params: TableClientQueryParams<TRow, TContext>): TableSourceExecutionResult<TRow> {
  const filteredRows = filterClientRows({
    rows: params.rows,
    filters: params.request.filters,
    search: params.request.search,
  })
  const sortedRows = sortClientRows({
    rows: filteredRows,
    sorting: params.request.sorting,
  })

  return paginateClientRows({
    rows: sortedRows,
    pagination: params.request.pagination,
  })
}

export interface TableClientFacetParams<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
> {
  rows: Iterable<TRow>
  request: TableSourceRequestContext<TRow, TContext>
  facets: TableFacetRequestDescriptor<string>[]
}

export function executeClientFacets<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
>(params: TableClientFacetParams<TRow, TContext>): TableFacetExecutionResult<string> {
  return {
    facets: params.facets.map((facet) => resolveClientFacet({
      rows: params.rows,
      request: params.request,
      facet,
    })),
  }
}

export function filterClientRows<TRow extends GenericObject>(params: {
  rows: Iterable<TRow>
  filters: TableResolvedFilterGroup<string>
  search: TableSourceRequestContext<TRow>['search']
}) {
  return [...lazyFilterRows(params.rows, {
    filters: params.filters,
    search: params.search,
  })]
}

export function sortClientRows<TRow extends GenericObject>(params: {
  rows: Iterable<TRow>
  sorting: TableSortingRule[]
}) {
  return [...lazySortRows(params.rows, params.sorting)]
}

export function paginateClientRows<TRow extends GenericObject>(params: {
  rows: Iterable<TRow>
  pagination: TableSourceRequestContext<TRow>['pagination']
}) {
  return paginateRows(params.rows, params.pagination)
}

function* lazyFilterRows<TRow extends GenericObject>(
  rows: Iterable<TRow>,
  params: {
    filters: TableResolvedFilterGroup<string>
    search: TableSourceRequestContext<TRow>['search']
  },
): Generator<TRow> {
  for (const row of rows) {
    if (matchesSearch(row, params.search) && matchesFilterNode(row, params.filters)) {
      yield row
    }
  }
}

function resolveClientFacet<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
>(options: {
  rows: Iterable<TRow>
  request: TableSourceRequestContext<TRow, TContext>
  facet: TableFacetRequestDescriptor<string>
}) {
  const matchingRows = lazyFilterRows(options.rows, {
    filters: options.facet.mode === 'include-self'
      ? options.request.filters
      : removeFilterKeyFromGroup({
          group: options.request.filters,
          key: options.facet.key,
        }),
    search: options.request.search,
  })
  const counts = countFacetOptions({
    rows: matchingRows,
    key: options.facet.key,
    search: options.facet.search,
  })
  const start = resolveFacetOffset(options.facet.cursor)
  const limited = options.facet.limit
    ? counts.slice(start, start + options.facet.limit)
    : counts.slice(start)

  return {
    key: options.facet.key,
    options: limited,
    nextCursor:
      options.facet.limit && start + options.facet.limit < counts.length
        ? String(start + options.facet.limit)
        : null,
    total: counts.length,
  }
}

function matchesSearch<TRow extends GenericObject>(
  row: TRow,
  search: TableSourceRequestContext<TRow>['search'],
): boolean {
  if (!search.value.trim().length || !search.fields.length) {
    return true
  }

  return search.fields.some((field) =>
    pathMatchesSearchValue({
      value: row,
      path: String(field),
      search: search.value,
    }),
  )
}

function pathMatchesSearchValue(options: {
  value: unknown
  path: string
  search: string
}): boolean {
  const segments = options.path.split('.')
  return matchSearchPathSegments({
    value: options.value,
    segments,
    search: options.search,
  })
}

function matchSearchPathSegments(options: {
  value: unknown
  segments: string[]
  search: string
}): boolean {
  if (options.segments.length === 0) {
    return valueMatchesSearch({
      value: options.value,
      search: options.search,
    })
  }

  if (isArray(options.value)) {
    return options.value.some((item) =>
      matchSearchPathSegments({
        value: item,
        segments: options.segments,
        search: options.search,
      }),
    )
  }

  if (!isObject(options.value)) {
    return false
  }

  const [head, ...tail] = options.segments
  if (!head || !(head in options.value)) {
    return false
  }

  return matchSearchPathSegments({
    value: (options.value as Record<string, unknown>)[head],
    segments: tail,
    search: options.search,
  })
}

function valueMatchesSearch(options: { value: unknown; search: string }): boolean {
  const normalizedSearch = normalizeString(options.search)

  if (isArray(options.value)) {
    return options.value.some((item) =>
      valueMatchesSearch({
        value: item,
        search: normalizedSearch,
      }),
    )
  }

  return normalizeString(options.value).includes(normalizedSearch)
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
    if (next.done) break
    buffer.push(next.value)
  }

  buffer.sort(compare)

  let cursor = 0

  while (cursor < buffer.length) {
    yield buffer[cursor++]!

    while (buffer.length < cursor + 1000) {
      const next = iterator.next()
      if (next.done) break

      const insertIndex = findInsertIndex({
        rows: buffer,
        value: next.value,
        compare,
        offset: cursor,
      })
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
      const comparison = compareUnknownValues({
        left: getFilterTargetValue({ source: left, key: rule.key }),
        right: getFilterTargetValue({ source: right, key: rule.key }),
      })

      if (comparison !== 0) return comparison * direction
    }

    return 0
  }
}

function findInsertIndex<TRow>(options: {
  rows: TRow[]
  value: TRow
  compare: (left: TRow, right: TRow) => number
  offset?: number
}): number {
  const offset = options.offset ?? 0
  let low = offset
  let high = options.rows.length

  while (low < high) {
    const mid = Math.floor((low + high) / 2)

    if (options.compare(options.value, options.rows[mid] as TRow) < 0) {
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
  const pageIndex = Math.max(1, pagination.pageIndex || 1)
  const pageSize = Math.max(1, pagination.pageSize || 1)
  const start = (pageIndex - 1) * pageSize

  const collected: TRow[] = []
  let index = 0
  let remaining = 0

  for (const row of rows) {
    if (index < start) {
      index++
      continue
    }

    if (collected.length < pageSize) {
      collected.push(row)
      index++
      continue
    }

    remaining++
  }

  return {
    rows: collected,
    rowCount: index + remaining,
  }
}

function removeFilterKeyFromGroup(options: {
  group: TableResolvedFilterGroup<string>
  key: string
}): TableResolvedFilterGroup<string> {
  const children: TableResolvedFilterNode<string>[] = []

  for (const child of options.group.children) {
    if (child.type === 'condition') {
      if (child.key !== options.key) children.push(child)
      continue
    }

    const nextGroup = removeFilterKeyFromGroup({
      group: child,
      key: options.key,
    })
    if (nextGroup.children.length) children.push(nextGroup)
  }

  return {
    ...options.group,
    children,
  }
}

function countFacetOptions<TRow extends GenericObject>(options: {
  rows: Iterable<TRow>
  key: string
  search?: string
}) {
  const countByValue = new Map<string, TableFacetOptionResult<string | number | boolean>>()
  const normalizedSearch = options.search?.trim().toLocaleLowerCase() ?? ''

  for (const row of options.rows) {
    const seenInRow = new Set<string>()

    for (const value of toValueList(getFilterTargetValue({ source: row, key: options.key }))) {
      if (
        typeof value !== 'string' &&
        typeof value !== 'number' &&
        typeof value !== 'boolean'
      ) continue

      const searchValue = String(value).toLocaleLowerCase()
      if (normalizedSearch.length && !searchValue.includes(normalizedSearch)) continue

      const mapKey = `${typeof value}:${String(value)}`
      if (seenInRow.has(mapKey)) continue

      seenInRow.add(mapKey)
      const current = countByValue.get(mapKey)
      if (current) {
        current.count += 1
        continue
      }

      countByValue.set(mapKey, {
        value,
        count: 1,
      })
    }
  }

  return [...countByValue.values()].sort(compareFacetOptions)
}

function compareFacetOptions(
  left: TableFacetOptionResult<string | number | boolean>,
  right: TableFacetOptionResult<string | number | boolean>,
) {
  if (left.count !== right.count) return right.count - left.count
  return compareUnknownValues({ left: left.value, right: right.value })
}

function resolveFacetOffset(cursor?: string | null) {
  if (!cursor) return 0

  const value = Number(cursor)
  return Number.isFinite(value) && value > 0 ? value : 0
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
  const value = getFilterTargetValue({
    source: row,
    key: condition.key,
  })

  switch (condition.operator) {
    case 'contains':
      return matchContains({ value, filter: condition.value })
    case 'is':
      return matchIs({ value, filter: condition.value })
    case 'isAnyOf':
      return matchIsAnyOf({ value, filter: condition.value })
    case 'isNot':
      return !matchIs({ value, filter: condition.value })
    case 'gt':
      return matchComparison({ value, filter: condition.value, operator: 'gt' })
    case 'gte':
      return matchComparison({ value, filter: condition.value, operator: 'gte' })
    case 'lt':
      return matchComparison({ value, filter: condition.value, operator: 'lt' })
    case 'lte':
      return matchComparison({ value, filter: condition.value, operator: 'lte' })
    case 'between':
      return matchBetween({ value, filter: condition.value })
    case 'before':
      return matchComparison({ value, filter: condition.value, operator: 'lt' })
    case 'after':
      return matchComparison({ value, filter: condition.value, operator: 'gt' })
    default:
      return false
  }
}

function getFilterTargetValue(options: { source: unknown; key: string }): unknown {
  return options.key.split('.').reduce<unknown>((current, segment) => {
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
  }, options.source)
}

function matchContains(options: { value: unknown; filter: unknown }): boolean {
  const needle = normalizeString(options.filter)

  if (!needle.length) {
    return true
  }

  return toValueList(options.value).some((item) => normalizeString(item).includes(needle))
}

function matchIs(options: { value: unknown; filter: unknown }): boolean {
  return toValueList(options.value).some((item) =>
    areEqual({
      left: item,
      right: options.filter,
    }),
  )
}

function matchIsAnyOf(options: { value: unknown; filter: unknown }): boolean {
  if (!isArray(options.filter)) {
    return matchIs(options)
  }

  return options.filter.some((candidate) =>
    matchIs({
      value: options.value,
      filter: candidate,
    }),
  )
}

function matchBetween(options: { value: unknown; filter: unknown }): boolean {
  if (!isObject(options.filter)) {
    return false
  }

  const from =
    'from' in options.filter
      ? normalizeComparable((options.filter as Record<string, unknown>).from)
      : null
  const to =
    'to' in options.filter
      ? normalizeComparable((options.filter as Record<string, unknown>).to)
      : null

  return toValueList(options.value).some((item) => {
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

function matchComparison(options: {
  value: unknown
  filter: unknown
  operator: 'gt' | 'gte' | 'lt' | 'lte'
}): boolean {
  const expected = normalizeComparable(options.filter)
  if (expected == null) {
    return false
  }

  return toValueList(options.value).some((item) => {
    const comparable = normalizeComparable(item)

    if (comparable == null) {
      return false
    }

    switch (options.operator) {
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

function areEqual(options: { left: unknown; right: unknown }): boolean {
  if (isDate(options.left) || isDate(options.right)) {
    const leftValue = normalizeComparable(options.left)
    const rightValue = normalizeComparable(options.right)
    return leftValue != null && leftValue === rightValue
  }

  return options.left === options.right
}

function compareUnknownValues(options: { left: unknown; right: unknown }): number {
  const leftComparable = normalizeComparableForSort(options.left)
  const rightComparable = normalizeComparableForSort(options.right)

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
