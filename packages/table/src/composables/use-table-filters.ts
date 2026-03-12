import { computed } from 'vue'
import type { ComputedRef } from 'vue'
import type { GenericObject, TableFiltersSchema, TableState } from '../types'
import type { TableFilterOperator } from '../types/filters'

/**
 * Canonical effective filter rule shape — includes provenance so serializers
 * and API adapters can treat static vs ui-authored filters differently.
 */
export interface TableEffectiveFilterRule {
  source: 'static' | 'ui'
  key: string
  operator: TableFilterOperator
  value: unknown
}

/**
 * Builds the effective filter pipeline from:
 * 1. Static filters (schema-defined, always applied, may use context values)
 * 2. UI filters (user-authored, driven by state.filters)
 *
 * Returns a computed array of effective rules with provenance.
 * This is the canonical filter representation passed to the source executor
 * and available to serializers.
 */
export function useTableEffectiveFilters<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
>(
  filtersSchema: TableFiltersSchema<TRow, TContext> | undefined,
  state: TableState,
  context: () => TContext,
): ComputedRef<readonly TableEffectiveFilterRule[]> {
  return computed<readonly TableEffectiveFilterRule[]>(() => {
    const rules: TableEffectiveFilterRule[] = []

    if (!filtersSchema) return rules

    // 1. Static filters — always applied, resolved against current context
    const staticFilters = filtersSchema.static ?? []
    for (const filter of staticFilters) {
      const value = typeof filter.value === 'function'
        ? filter.value(context())
        : filter.value

      rules.push({
        source: 'static',
        key: filter.key as string,
        operator: filter.operator,
        value,
      })
    }

    // 2. UI filters — driven by state.filters
    const uiFilters = filtersSchema.ui
    if (uiFilters) {
      const definitions = typeof uiFilters === 'function'
        ? uiFilters({} as any)  // builder resolved at runtime — will be properly resolved in engine
        : uiFilters

      for (const definition of definitions) {
        const value = state.filters[definition.key as keyof typeof state.filters]
        if (value === undefined || value === null || value === '') continue

        const operator = (definition.operators?.[0] ?? defaultOperatorForKind(definition.kind)) as TableFilterOperator

        rules.push({
          source: 'ui',
          key: definition.key as string,
          operator,
          value,
        })
      }
    }

    return rules
  })
}

function defaultOperatorForKind(kind: string): TableFilterOperator {
  switch (kind) {
    case 'text': return 'contains'
    case 'option': return 'isAnyOf'
    case 'boolean': return 'is'
    case 'number': return 'gt'
    case 'date': return 'after'
    default: return 'is'
  }
}
