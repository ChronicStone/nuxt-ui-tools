import {
  isArray,
  isBoolean,
  isDate,
  isNumber,
  isObject,
  isString,
  isNullish,
} from '../../shared/utils/predicate'
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
    filters: params.request.filters,
    rows: params.rows,
    search: params.request.search,
  })
  const sortedRows = sortClientRows({
    rows: filteredRows,
    sorting: params.request.sorting,
  })

  return paginateClientRows({
    pagination: params.request.pagination,
    rows: sortedRows,
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
    facets: params.facets.map((facet) =>
      resolveClientFacet({
        facet,
        request: params.request,
        rows: params.rows,
      }),
    ),
  }
}

export function filterClientRows<TRow extends GenericObject>(params: {
  rows: Iterable<TRow>
  filters: TableResolvedFilterGroup<string>
  search: TableSourceRequestContext<TRow>['search']
}) {
  return [
    ...lazyFilterRows(params.rows, {
      filters: params.filters,
      search: params.search,
    }),
  ]
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
    filters:
      options.facet.mode === 'include-self'
        ? options.request.filters
        : removeFilterKeyFromGroup({
            group: options.request.filters,
            key: options.facet.key,
          }),
    search: options.request.search,
  })
  const counts = countFacetOptions({
    key: options.facet.key,
    rows: matchingRows,
    search: options.facet.search,
  })
  const start = resolveFacetOffset(options.facet.cursor)
  const limited = options.facet.limit
    ? counts.slice(start, start + options.facet.limit)
    : counts.slice(start)

  return {
    key: options.facet.key,
    nextCursor:
      options.facet.limit && start + options.facet.limit < counts.length
        ? String(start + options.facet.limit)
        : null,
    options: limited,
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
      path: String(field),
      search: search.value,
      value: row,
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
    search: options.search,
    segments,
    value: options.value,
  })
}

function matchSearchPathSegments(options: {
  value: unknown
  segments: string[]
  search: string
}): boolean {
  if (options.segments.length === 0) {
    return valueMatchesSearch({
      search: options.search,
      value: options.value,
    })
  }

  if (isArray(options.value)) {
    return options.value.some((item) =>
      matchSearchPathSegments({
        search: options.search,
        segments: options.segments,
        value: item,
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
    search: options.search,
    segments: tail,
    value: options.value[head],
  })
}

function valueMatchesSearch(options: { value: unknown; search: string }): boolean {
  const normalizedSearch = normalizeString(options.search)

  if (isArray(options.value)) {
    return options.value.some((item) =>
      valueMatchesSearch({
        search: normalizedSearch,
        value: item,
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
    if (next.done) {
      break
    }
    buffer.push(next.value)
  }

  buffer.sort(compare)

  let cursor = 0

  while (cursor < buffer.length) {
    const item = buffer[cursor]
    cursor += 1
    if (item !== undefined) {
      yield item
    }

    while (buffer.length < cursor + 1000) {
      const next = iterator.next()
      if (next.done) {
        break
      }

      const insertIndex = findInsertIndex({
        compare,
        offset: cursor,
        rows: buffer,
        value: next.value,
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
        left: getFilterTargetValue({ key: rule.key, source: left }),
        right: getFilterTargetValue({ key: rule.key, source: right }),
      })

      if (comparison !== 0) {
        return comparison * direction
      }
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

    const row = options.rows[mid]
    if (row === undefined) {
      throw new RangeError(`Missing row at sorted insert index ${mid}.`)
    }

    if (options.compare(options.value, row) < 0) {
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
  if (pagination.mode !== 'offset') {
    const collected = [...rows]
    return { rowCount: collected.length, rows: collected }
  }

  const pageIndex = Math.max(1, pagination.pageIndex || 1)
  const pageSize = Math.max(1, pagination.pageSize || 1)
  const start = (pageIndex - 1) * pageSize

  const collected: TRow[] = []
  let index = 0
  let remaining = 0

  for (const row of rows) {
    if (index < start) {
      index += 1
      continue
    }

    if (collected.length < pageSize) {
      collected.push(row)
      index += 1
      continue
    }

    remaining += 1
  }

  return {
    rowCount: index + remaining,
    rows: collected,
  }
}

function removeFilterKeyFromGroup(options: {
  group: TableResolvedFilterGroup<string>
  key: string
}): TableResolvedFilterGroup<string> {
  const children: TableResolvedFilterNode<string>[] = []

  for (const child of options.group.children) {
    if (child.type === 'condition') {
      if (child.key !== options.key) {
        children.push(child)
      }
      continue
    }

    const nextGroup = removeFilterKeyFromGroup({
      group: child,
      key: options.key,
    })
    if (nextGroup.children.length) {
      children.push(nextGroup)
    }
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

    for (const value of toValueList(getFilterTargetValue({ key: options.key, source: row }))) {
      if (!isString(value) && !isNumber(value) && !isBoolean(value)) {
        continue
      }

      const searchValue = String(value).toLocaleLowerCase()
      if (normalizedSearch.length && !searchValue.includes(normalizedSearch)) {
        continue
      }

      const mapKey = `${resolvePrimitiveValueKind(value)}:${String(value)}`
      if (seenInRow.has(mapKey)) {
        continue
      }

      seenInRow.add(mapKey)
      const current = countByValue.get(mapKey)
      if (current) {
        current.count += 1
        continue
      }

      countByValue.set(mapKey, {
        count: 1,
        value,
      })
    }
  }

  return [...countByValue.values()].sort(compareFacetOptions)
}

function compareFacetOptions(
  left: TableFacetOptionResult<string | number | boolean>,
  right: TableFacetOptionResult<string | number | boolean>,
) {
  if (left.count !== right.count) {
    return right.count - left.count
  }
  return compareUnknownValues({ left: left.value, right: right.value })
}

function resolveFacetOffset(cursor?: string | null) {
  if (!cursor) {
    return 0
  }

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
    key: condition.key,
    source: row,
  })

  switch (condition.operator) {
    case 'contains': {
      return matchContains({ filter: condition.value, value })
    }
    case 'is': {
      return matchIs({ filter: condition.value, value })
    }
    case 'isAnyOf': {
      return matchIsAnyOf({ filter: condition.value, value })
    }
    case 'isNot': {
      return !matchIsAnyOf({ filter: condition.value, value })
    }
    case 'gt': {
      return matchComparison({ filter: condition.value, operator: 'gt', value })
    }
    case 'gte': {
      return matchComparison({ filter: condition.value, operator: 'gte', value })
    }
    case 'lt': {
      return matchComparison({ filter: condition.value, operator: 'lt', value })
    }
    case 'lte': {
      return matchComparison({ filter: condition.value, operator: 'lte', value })
    }
    case 'between': {
      return matchBetween({ filter: condition.value, value })
    }
    case 'before': {
      return matchComparison({ filter: condition.value, operator: 'lt', value })
    }
    case 'after': {
      return matchComparison({ filter: condition.value, operator: 'gt', value })
    }
    default: {
      return false
    }
  }
}

function getFilterTargetValue<TSource>(options: { source: TSource; key: string }) {
  return options.key.split('.').reduce<unknown>((current, segment) => {
    if (isArray(current)) {
      return current.map((item) => (isObject(item) ? item[segment] : undefined))
    }

    if (!isObject(current)) {
      return
    }

    return current[segment]
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
      filter: candidate,
      value: options.value,
    }),
  )
}

function matchBetween(options: { value: unknown; filter: unknown }): boolean {
  if (!isObject(options.filter)) {
    return false
  }

  const from = 'from' in options.filter ? normalizeComparable(options.filter.from) : null
  const to = 'to' in options.filter ? normalizeComparable(options.filter.to) : null

  return toValueList(options.value).some((item) => {
    const comparable = normalizeComparable(item)

    if (isNullish(comparable)) {
      return false
    }

    if (!isNullish(from) && comparable < from) {
      return false
    }

    if (!isNullish(to) && comparable > to) {
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
  if (isNullish(expected)) {
    return false
  }

  return toValueList(options.value).some((item) => {
    const comparable = normalizeComparable(item)

    if (isNullish(comparable)) {
      return false
    }

    switch (options.operator) {
      case 'gt': {
        return comparable > expected
      }
      case 'gte': {
        return comparable >= expected
      }
      case 'lt': {
        return comparable < expected
      }
      case 'lte': {
        return comparable <= expected
      }
    }
  })
}

function toValueList<TValue>(value: TValue): unknown[] {
  if (!isArray(value)) {
    return [value]
  }

  return value.flatMap((item) => (isArray(item) ? toValueList(item) : [item]))
}

function areEqual(options: { left: unknown; right: unknown }): boolean {
  if (isDate(options.left) || isDate(options.right)) {
    const leftValue = normalizeComparable(options.left)
    const rightValue = normalizeComparable(options.right)
    return !isNullish(leftValue) && leftValue === rightValue
  }

  return options.left === options.right
}

function compareUnknownValues(options: { left: unknown; right: unknown }): number {
  const leftComparable = normalizeComparableForSort(options.left)
  const rightComparable = normalizeComparableForSort(options.right)

  if (isNullish(leftComparable) && isNullish(rightComparable)) {
    return 0
  }

  if (isNullish(leftComparable)) {
    return 1
  }

  if (isNullish(rightComparable)) {
    return -1
  }

  if (isString(leftComparable) && isString(rightComparable)) {
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

function normalizeComparableForSort<TValue>(value: TValue): number | string | null {
  if (isArray(value)) {
    return normalizeComparableForSort(value[0])
  }

  if (isDate(value)) {
    return value.getTime()
  }

  if (isNumber(value)) {
    return value
  }

  if (isBoolean(value)) {
    return value ? 1 : 0
  }

  if (isString(value)) {
    return value.toLocaleLowerCase()
  }

  if (isNullish(value)) {
    return null
  }

  return String(value).toLocaleLowerCase()
}

function normalizeComparable<TValue>(value: TValue): number | string | null {
  if (isDate(value)) {
    return value.getTime()
  }

  if (isNumber(value)) {
    return value
  }

  if (isString(value)) {
    const maybeTimestamp = Date.parse(value)

    if (!Number.isNaN(maybeTimestamp) && /\d{4}-\d{2}-\d{2}/u.test(value)) {
      return maybeTimestamp
    }

    return value.toLocaleLowerCase()
  }

  if (isBoolean(value)) {
    return value ? 1 : 0
  }

  return null
}

function normalizeString<TValue>(value: TValue): string {
  if (isNullish(value)) {
    return ''
  }

  return String(value).toLocaleLowerCase()
}

function resolvePrimitiveValueKind<TValue>(value: TValue): 'string' | 'number' | 'boolean' {
  if (isString(value)) {
    return 'string'
  }
  if (isNumber(value)) {
    return 'number'
  }
  return 'boolean'
}
