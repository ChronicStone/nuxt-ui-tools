import type { QueryCodec } from '#query-state'
import {
  booleanCodec,
  createArrayCodec,
  createEnumCodec,
  dateISOCodec,
  numberCodec,
  stringCodec,
} from '#query-state'

import { isObject, isString } from '../../shared'
import { DEFAULT_FILTER_OPERATOR, PAGINATION_DEFAULTS } from '../constants/query-state'
import type {
  TableFilterOperator,
  TableLayout,
  TableUiFilterDefinition,
  TableQueryStateFilterDefinition,
  TableQueryStateFilterRange,
  TableQueryStateFilterValue,
  TableSchemaView,
  TableSortingDirection,
} from '../types'

export function getDefaultPageSize(params: {
  schema: TableSchemaView
  layout: TableLayout
}): number {
  const paginationConf = params.schema.pagination
  if (!isObject(paginationConf)) return PAGINATION_DEFAULTS.defaultSize[params.layout]
  if (isObject(paginationConf.defaultSize))
    return (
      paginationConf.defaultSize[params.layout] ?? PAGINATION_DEFAULTS.defaultSize[params.layout]
    )

  return paginationConf.defaultSize ?? PAGINATION_DEFAULTS.defaultSize[params.layout]
}

export function getPageSizeOptions(params: {
  schema: TableSchemaView
  layout: TableLayout
}): number[] {
  const paginationConf = params.schema.pagination

  if (!isObject(paginationConf)) {
    return PAGINATION_DEFAULTS.sizes[params.layout]
  }

  if (Array.isArray(paginationConf.sizeOptions)) {
    return paginationConf.sizeOptions
  }

  if (isObject(paginationConf.sizeOptions)) {
    return paginationConf.sizeOptions[params.layout] ?? PAGINATION_DEFAULTS.sizes[params.layout]
  }

  return PAGINATION_DEFAULTS.sizes[params.layout]
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

      if (definition.kind === 'option' && rawValue.includes(',')) {
        return createArrayCodec(stringCodec).parse(rawValue)
      }

      if ((definition.kind === 'number' || definition.kind === 'date') && rawValue.includes('..')) {
        const [from, to] = rawValue.split('..')

        return {
          ...(from ? { from: parseRangeScalar(from, definition) } : {}),
          ...(to ? { to: parseRangeScalar(to, definition) } : {}),
        }
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
        const from =
          value.from == null ? '' : serializeScalar(value.from as string | number | boolean | Date)
        const to =
          value.to == null ? '' : serializeScalar(value.to as string | number | boolean | Date)
        return `${from}..${to}`
      }

      if (value instanceof Date) {
        return dateISOCodec.serialize(value)
      }

      if (typeof value === 'number') {
        return numberCodec.serialize(value)
      }

      if (typeof value === 'boolean') {
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
  if (definition.kind !== 'number') {
    return definition as TableQueryStateFilterDefinition
  }

  const defaultValue = definition.defaultValue

  if (!defaultValue || typeof defaultValue !== 'object' || Array.isArray(defaultValue)) {
    return definition as TableQueryStateFilterDefinition
  }

  if ('from' in defaultValue || 'to' in defaultValue) {
    return definition as TableQueryStateFilterDefinition
  }

  return {
    ...definition,
    defaultValue: {
      ...('min' in defaultValue ? { from: defaultValue.min } : {}),
      ...('max' in defaultValue ? { to: defaultValue.max } : {}),
    },
  }
}

function isRange(value: unknown): value is TableQueryStateFilterRange<unknown> {
  if (!value || typeof value !== 'object') {
    return false
  }

  return 'from' in value || 'to' in value
}

function serializeScalar(value: string | number | boolean | Date): string {
  if (value instanceof Date) {
    return value.toISOString()
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }

  return String(value)
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

function parseRangeScalar(
  rawValue: string,
  definition: TableQueryStateFilterDefinition,
): string | number | Date {
  if (definition.kind === 'number') {
    return numberCodec.parse(rawValue)
  }

  if (definition.kind === 'date') {
    return dateISOCodec.parse(rawValue)
  }

  return stringCodec.parse(rawValue)
}
