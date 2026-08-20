import type { QueryCodec } from '#ui-tools/query-state/codecs'
import {
  booleanCodec,
  createArrayCodec,
  createEnumCodec,
  dateISOCodec,
  numberCodec,
  stringCodec,
} from '#ui-tools/query-state/codecs'

import type { GenericObject } from '../../shared/types/utils'
import { isBoolean, isNumber, isObject, isString } from '../../shared/utils/predicate'
import { DEFAULT_FILTER_OPERATOR, PAGINATION_DEFAULTS } from '../constants/query-state'
import type {
  TableFilterOperator,
  TableLayout,
  TableQueryStateFilterRule,
  TableUiFilterDefinition,
  TableQueryStateFilterDefinition,
  TableQueryStateFilterRange,
  TableQueryStateFilterValue,
  TableSchemaView,
  TableSortingDirection,
  TablePaginationState,
  TablePaginationSchema,
} from '../types'

export function getPaginationMode(schema: {
  pagination?: TablePaginationSchema
}): TablePaginationState['mode'] {
  if (schema.pagination === false) return 'none'
  if (schema.pagination?.mode === 'cursor') return 'cursor'
  return 'offset'
}

export function getDefaultPageSize(params: {
  schema: TableSchemaView
  layout: TableLayout
}): number {
  const paginationConf = params.schema.pagination
  if (!isObject(paginationConf)) return PAGINATION_DEFAULTS.defaultSize[params.layout]
  if ('mode' in paginationConf && paginationConf.mode === 'cursor') {
    if (isNumber(paginationConf.pageSize)) return paginationConf.pageSize
    if (isLayoutNumberMap(paginationConf.pageSize))
      return (
        paginationConf.pageSize[params.layout] ?? PAGINATION_DEFAULTS.defaultSize[params.layout]
      )

    return PAGINATION_DEFAULTS.defaultSize[params.layout]
  }
  if (isNumber(paginationConf.defaultSize)) return paginationConf.defaultSize
  if (isLayoutNumberMap(paginationConf.defaultSize))
    return (
      paginationConf.defaultSize[params.layout] ?? PAGINATION_DEFAULTS.defaultSize[params.layout]
    )

  return PAGINATION_DEFAULTS.defaultSize[params.layout]
}

export function getPageSizeOptions(params: {
  schema: TableSchemaView
  layout: TableLayout
}): number[] {
  const paginationConf = params.schema.pagination

  if (!isObject(paginationConf)) {
    return PAGINATION_DEFAULTS.sizes[params.layout]
  }

  if ('mode' in paginationConf && paginationConf.mode === 'cursor') {
    return PAGINATION_DEFAULTS.sizes[params.layout]
  }

  if (Array.isArray(paginationConf.sizeOptions)) {
    return paginationConf.sizeOptions
  }

  if (isLayoutPageSizeMap(paginationConf.sizeOptions)) {
    return paginationConf.sizeOptions[params.layout] ?? PAGINATION_DEFAULTS.sizes[params.layout]
  }

  return PAGINATION_DEFAULTS.sizes[params.layout]
}

function isLayoutNumberMap<T>(value: T): value is T & Partial<Record<TableLayout, number>> {
  return isObject(value)
}

function isLayoutPageSizeMap<T>(value: T): value is T & Partial<Record<TableLayout, number[]>> {
  return isObject(value)
}

export function getDefaultSort(params: {
  schema: TableSchemaView
  layout: TableLayout
}): { key: string; dir: TableSortingDirection } | null {
  const defaultSorting = params.schema[params.layout]?.defaultSorting
  if (!defaultSorting) return null
  else if (isString(defaultSorting)) return { key: defaultSorting, dir: 'asc' as const }
  else return defaultSorting
}

export function getSortKeys(params: { schema: TableSchemaView; layout: TableLayout }): string[] {
  const keys = new Set<string>()
  const defaultSort = getDefaultSort(params)

  if (defaultSort?.key) {
    keys.add(defaultSort.key)
  }

  for (const option of params.schema.grid?.sortOptions ?? []) {
    keys.add(option.key)
  }

  for (const column of params.schema.table?.columns ?? []) {
    if (column.kind === 'field' && column.sortable !== false) {
      keys.add(column.field)
    }

    if (column.kind === 'composite' && column.sortableKey) {
      keys.add(column.sortableKey)
    }
  }

  return [...keys]
}

export function createSortKeyCodec(sortKeys: string[]): QueryCodec<string | undefined> {
  return createEnumCodec(sortKeys)
}

export function createTableFilterValueCodec(
  definition: TableQueryStateFilterDefinition,
): QueryCodec<TableQueryStateFilterValue | undefined> {
  return {
    parse(rawValue) {
      if (!rawValue) {
        return definition.defaultValue
      }

      if (definition.kind === 'option') {
        return createArrayCodec(stringCodec).parse(rawValue)
      }

      if (definition.kind === 'number' && rawValue.includes('..')) {
        const [from, to] = rawValue.split('..')
        const range: TableQueryStateFilterValue = {}

        if (from) range.from = numberCodec.parse(from)
        if (to) range.to = numberCodec.parse(to)
        return range
      }

      if (definition.kind === 'date' && rawValue.includes('..')) {
        const [from, to] = rawValue.split('..')
        const range: TableQueryStateFilterValue = {}

        if (from) range.from = dateISOCodec.parse(from)
        if (to) range.to = dateISOCodec.parse(to)
        return range
      }

      return parseScalar(rawValue, definition)
    },
    serialize(value) {
      if (value == null) {
        return null
      }

      if (Array.isArray(value)) {
        return value.map((item) => serializeScalar(item)).join(',')
      }

      if (isRange(value)) {
        const from = serializeOptionalScalar(value.from)
        const to = serializeOptionalScalar(value.to)
        return `${from}..${to}`
      }

      if (value instanceof Date) {
        return dateISOCodec.serialize(value)
      }

      if (isNumber(value)) {
        return numberCodec.serialize(value)
      }

      if (isBoolean(value)) {
        return booleanCodec.serialize(value)
      }

      return stringCodec.serialize(String(value))
    },
  }
}

export function resolveFilterDefaultOperator(
  definition: TableQueryStateFilterDefinition,
): TableFilterOperator {
  if (definition.defaultOperator) return definition.defaultOperator
  return DEFAULT_FILTER_OPERATOR[definition.kind]
}

export function resolveFilterSupportedOperators(
  definition: TableQueryStateFilterDefinition,
): TableFilterOperator[] {
  const defaultOperator = resolveFilterDefaultOperator(definition)

  if (!definition.operators?.length) return [defaultOperator]
  return [...new Set([defaultOperator, ...definition.operators])]
}

export function normalizeFilterDefinition(
  definition: TableQueryStateFilterDefinition | TableUiFilterDefinition,
): TableQueryStateFilterDefinition {
  const hasBehavior = 'behavior' in definition
  const defaultValue = hasBehavior
    ? definition.behavior?.defaultValue
    : 'defaultValue' in definition
      ? definition.defaultValue
      : undefined
  const defaultOperator = hasBehavior
    ? definition.behavior?.defaultOperator
    : 'defaultOperator' in definition
      ? definition.defaultOperator
      : undefined
  const operators = hasBehavior
    ? definition.behavior?.operators
    : 'operators' in definition
      ? definition.operators
      : undefined

  if (definition.kind !== 'number') {
    return {
      ...definition,
      defaultOperator,
      operators,
      defaultValue,
    }
  }

  if (isMinMaxNumberRange(defaultValue)) {
    const range: TableQueryStateFilterValue = {}
    if ('min' in defaultValue) range.from = defaultValue.min
    if ('max' in defaultValue) range.to = defaultValue.max
    return {
      ...definition,
      defaultOperator,
      operators,
      defaultValue: range,
    }
  }

  return {
    ...definition,
    defaultOperator,
    operators,
    defaultValue,
  }
}

export function resolveTableFilterDefaultRules(
  definitions: TableUiFilterDefinition[],
): TableQueryStateFilterRule[] {
  return definitions.flatMap((definition) => {
    const normalizedDefinition = normalizeFilterDefinition(definition)
    const value = normalizedDefinition.defaultValue

    if (value === undefined || !hasFilterValue(value)) {
      return []
    }

    return [
      {
        key: normalizedDefinition.key,
        operator: resolveFilterDefaultOperator(normalizedDefinition),
        value,
      },
    ]
  })
}

export function mergeTableFilterDefaultRules(options: {
  rules: TableQueryStateFilterRule[]
  definitions: TableUiFilterDefinition[]
}): TableQueryStateFilterRule[] {
  const defaults = new Map(
    resolveTableFilterDefaultRules(options.definitions).map((rule) => [rule.key, rule]),
  )
  const definitionKeys = new Set(options.definitions.map((definition) => definition.key))
  const merged = options.definitions.flatMap((definition) => {
    const rule = options.rules.find((candidate) => candidate.key === definition.key)
    const defaultRule = defaults.get(definition.key)
    return rule ? [rule] : defaultRule ? [defaultRule] : []
  })

  return [...merged, ...options.rules.filter((rule) => !definitionKeys.has(rule.key))]
}

export function isTableFilterRuleDefault(options: {
  rule: TableQueryStateFilterRule
  definition: TableUiFilterDefinition
}): boolean {
  const normalizedDefinition = normalizeFilterDefinition(options.definition)
  const defaultValue = normalizedDefinition.defaultValue

  return (
    defaultValue !== undefined &&
    (options.rule.operator ?? resolveFilterDefaultOperator(normalizedDefinition)) ===
      resolveFilterDefaultOperator(normalizedDefinition) &&
    areFilterValuesEqual(options.rule.value, defaultValue)
  )
}

/**
 * Returns only filter rules that deviate from their schema defaults.
 *
 * The full rule set remains effective for data queries, while this subset drives active-filter UI,
 * counts, and reset affordances. Rules without a matching UI definition are treated as active.
 */
export function resolveTableActiveFilterRules(options: {
  /** Effective filter rules, including materialized schema defaults. */
  rules: TableQueryStateFilterRule[]
  /** UI filter definitions that own the default baseline. */
  definitions: TableUiFilterDefinition[]
}): TableQueryStateFilterRule[] {
  return options.rules.filter((rule) => {
    const definition = options.definitions.find((candidate) => candidate.key === rule.key)
    return !definition || !isTableFilterRuleDefault({ rule, definition })
  })
}

export function parseTableFilterQueryState(options: {
  entries: ReadonlyMap<string, unknown>
  definitions: TableUiFilterDefinition[]
}): TableQueryStateFilterRule[] {
  const rules: TableQueryStateFilterRule[] = []

  for (const filter of options.definitions) {
    const definition = normalizeFilterDefinition(filter)
    const operators = resolveFilterSupportedOperators(definition)
    const defaultOperator = resolveFilterDefaultOperator(definition)

    for (const operator of operators) {
      const urlKey = operator === defaultOperator ? definition.key : `${definition.key}~${operator}`
      const value = options.entries.get(urlKey)

      if (isTableFilterValue(value)) {
        rules.push({ key: definition.key, operator, value })
        break
      }
    }
  }

  return mergeTableFilterDefaultRules({ rules, definitions: options.definitions })
}

export function serializeTableFilterQueryState(options: {
  rules: TableQueryStateFilterRule[]
  definitions: TableUiFilterDefinition[]
}): Map<string, unknown> {
  const result = new Map<string, unknown>()

  for (const rule of options.rules) {
    const filter = options.definitions.find((definition) => definition.key === rule.key)
    if (!filter || isTableFilterRuleDefault({ rule, definition: filter })) continue

    const definition = normalizeFilterDefinition(filter)
    const operator = rule.operator ?? resolveFilterDefaultOperator(definition)
    const defaultOperator = resolveFilterDefaultOperator(definition)
    const urlKey = operator === defaultOperator ? definition.key : `${definition.key}~${operator}`

    result.set(urlKey, rule.value)
  }

  return result
}

type FilterRangeValue = TableQueryStateFilterRange<GenericObject[string]>

function isRange<T>(value: T): value is T & FilterRangeValue {
  return isObject(value) && ('from' in value || 'to' in value)
}

function hasFilterValue(value: TableQueryStateFilterValue): boolean {
  if (Array.isArray(value)) return value.length > 0
  if (isString(value)) return value.length > 0
  if (isRange(value)) return value.from != null || value.to != null
  return true
}

function isTableFilterValue<T>(value: T): value is T & TableQueryStateFilterValue {
  if (isString(value) || isNumber(value) || isBoolean(value) || value instanceof Date) {
    return true
  }

  if (Array.isArray(value)) {
    return value.every((item) => isString(item) || isNumber(item) || isBoolean(item))
  }

  if (!isRange(value)) return false

  return [value.from, value.to].every(
    (item) => item == null || isNumber(item) || item instanceof Date,
  )
}

function areFilterValuesEqual(
  left: TableQueryStateFilterValue,
  right: TableQueryStateFilterValue,
): boolean {
  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false

    const unmatched = [...right]
    for (const value of left) {
      const index = unmatched.findIndex((candidate) => Object.is(candidate, value))
      if (index === -1) return false
      unmatched.splice(index, 1)
    }

    return true
  }

  if (left instanceof Date || right instanceof Date) {
    return left instanceof Date && right instanceof Date && left.getTime() === right.getTime()
  }

  if (isRange(left) || isRange(right)) {
    if (!isRange(left) || !isRange(right)) return false

    return (
      areOptionalFilterValuesEqual(left.from, right.from) &&
      areOptionalFilterValuesEqual(left.to, right.to)
    )
  }

  return Object.is(left, right)
}

function areOptionalFilterValuesEqual<TLeft, TRight>(left: TLeft, right: TRight): boolean {
  if (left instanceof Date || right instanceof Date) {
    return left instanceof Date && right instanceof Date && left.getTime() === right.getTime()
  }

  return Object.is(left, right)
}

function isMinMaxNumberRange<T>(value: T): value is T & { min?: number; max?: number } {
  if (!isObject(value) || Array.isArray(value)) return false

  if ('from' in value || 'to' in value) {
    return false
  }

  const minValue = 'min' in value ? value.min : undefined
  const maxValue = 'max' in value ? value.max : undefined

  return (minValue == null || isNumber(minValue)) && (maxValue == null || isNumber(maxValue))
}

function serializeScalar(value: string | number | boolean | Date): string {
  if (value instanceof Date) {
    return value.toISOString()
  }

  if (isBoolean(value)) {
    return value ? 'true' : 'false'
  }

  return String(value)
}

function serializeOptionalScalar<T>(value: T): string {
  if (value == null) return ''
  if (isString(value) || isNumber(value) || isBoolean(value) || value instanceof Date)
    return serializeScalar(value)
  return ''
}

function parseScalar(
  rawValue: string,
  definition: TableQueryStateFilterDefinition,
): string | number | boolean | Date {
  if (definition.kind === 'boolean') {
    return booleanCodec.parse(rawValue)
  }

  if (definition.kind === 'number') {
    return numberCodec.parse(rawValue)
  }

  if (definition.kind === 'date') {
    return dateISOCodec.parse(rawValue)
  }

  return stringCodec.parse(rawValue)
}
