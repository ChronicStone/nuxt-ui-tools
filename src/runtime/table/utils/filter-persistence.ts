import { isObject, isString } from '../../shared/utils/predicate'
import type { TableQueryStateFilterRule, TableUiFilterDefinition } from '../types'
import {
  createTableFilterValueCodec,
  normalizeFilterDefinition,
  resolveFilterDefaultOperator,
  resolveFilterSupportedOperators,
} from './query-state'

const STORAGE_PREFIX = 'nuxt-ui-tools:table-filter'

/** Storage key of one persisted filter, scoped by table key. */
export function persistedFilterStorageKey(options: { tableKey: string; filterKey: string }) {
  return `${STORAGE_PREFIX}:${options.tableKey}:${options.filterKey}`
}

/** Serializes a rule with the filter's URL codec, or returns `null` when it has nothing to keep. */
export function serializePersistedFilterRule(options: {
  definition: TableUiFilterDefinition
  rule: TableQueryStateFilterRule
}) {
  const normalized = normalizeFilterDefinition(options.definition)
  const value = createTableFilterValueCodec(normalized).serialize(options.rule.value)

  return value === null
    ? null
    : JSON.stringify({
        operator: options.rule.operator ?? resolveFilterDefaultOperator(normalized),
        value,
      })
}

/** Reads a stored rule back, dropping anything the filter no longer accepts. */
export function parsePersistedFilterRule(options: {
  definition: TableUiFilterDefinition
  raw: string | null
}): TableQueryStateFilterRule | null {
  if (!options.raw) {
    return null
  }

  const stored = parseStoredRule(options.raw)

  if (!stored) {
    return null
  }

  const normalized = normalizeFilterDefinition(options.definition)
  const operator = resolveFilterSupportedOperators(normalized).find(
    (candidate) => candidate === stored.operator,
  )
  const value = createTableFilterValueCodec(normalized).parse(stored.value)

  return operator && value !== undefined ? { key: options.definition.key, operator, value } : null
}

function parseStoredRule(raw: string): { operator: string; value: string } | null {
  try {
    const stored: unknown = JSON.parse(raw)

    return isObject(stored) && isString(stored.operator) && isString(stored.value)
      ? { operator: stored.operator, value: stored.value }
      : null
  } catch {
    return null
  }
}
