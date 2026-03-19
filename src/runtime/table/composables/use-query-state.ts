import { computed, type ComputedRef } from 'vue'

import {
  useQueryStates,
  dynamicQueryState,
  numberCodec,
  stringCodec,
  createEnumCodec,
} from '#ui-tools/query-state'

import type {
  TableFilterOperator,
  TableLayout,
  TableQueryStateFilterRule,
  TableQueryStateFilterValue,
  TableSchemaView,
  TableUiFilterDefinition,
} from '../types'
import {
  createTableFilterValueCodec,
  getDefaultPageSize,
  getDefaultSort,
  normalizeFilterDefinition,
  resolveFilterDefaultOperator,
  resolveFilterSupportedOperators,
} from '../utils'

export interface UseQueryStateParams {
  schema: ComputedRef<TableSchemaView>
  activeLayout: ComputedRef<TableLayout>
}

export function useQueryState(params: UseQueryStateParams) {
  const defaultPageSize = getDefaultPageSize({
    schema: params.schema.value,
    layout: params.activeLayout.value,
  })

  const defaultSort = getDefaultSort({
    schema: params.schema.value,
    layout: params.activeLayout.value,
  })

  // ---------------------------------------------------------------------------
  // Pagination — URL keys: p.page, p.size
  // ---------------------------------------------------------------------------

  const pagination = useQueryStates({
    prefix: 'p',
    schema: {
      pageIndex: { urlKey: 'page', codec: numberCodec, defaultValue: 1 },
      pageSize: { urlKey: 'size', codec: numberCodec, defaultValue: defaultPageSize },
    },
    historyMode: 'push',
  })

  // ---------------------------------------------------------------------------
  // Sorting — URL keys: s.key, s.dir
  // ---------------------------------------------------------------------------

  const sortingState = useQueryStates({
    prefix: 's',
    schema: {
      key: { codec: stringCodec, defaultValue: defaultSort?.key ?? '' },
      dir: { codec: createEnumCodec(['asc', 'desc']), defaultValue: defaultSort?.dir },
    },
    historyMode: 'push',
  })

  // Domain mapping: empty key → null (consumers expect nullable sorting)
  const sorting = computed({
    get() {
      const { key, dir } = sortingState.value
      if (!key) return null
      return { key, dir: dir ?? 'asc' }
    },
    set(value: { key: string; dir: 'asc' | 'desc' } | null) {
      sortingState.value = value ? { key: value.key, dir: value.dir } : { key: '', dir: undefined }
    },
  })

  // ---------------------------------------------------------------------------
  // Filters — URL keys: f.search, f.ui.{key}, f.ui.{key}~{operator}
  // ---------------------------------------------------------------------------

  const filters = useQueryStates({
    prefix: 'f',
    schema: {
      search: { codec: stringCodec, defaultValue: '' },
      ui: dynamicQueryState<TableUiFilterDefinition, TableQueryStateFilterRule[]>({
        urlPrefix: 'ui',
        definitions: () => params.schema.value.filters?.ui ?? [],
        defaultValue: [],

        resolve(filter) {
          const definition = normalizeFilterDefinition(filter)
          const operators = resolveFilterSupportedOperators(definition)
          const defaultOp = resolveFilterDefaultOperator(definition)
          const codec = createTableFilterValueCodec(definition)

          return operators.map((op) => ({
            urlKey: op === defaultOp ? definition.key : `${definition.key}~${op}`,
            codec,
          }))
        },

        parse(entries, definitions) {
          const rules: TableQueryStateFilterRule[] = []

          for (const filter of definitions) {
            const definition = normalizeFilterDefinition(filter)
            const operators = resolveFilterSupportedOperators(definition)
            const defaultOp = resolveFilterDefaultOperator(definition)

            for (const op of operators) {
              const urlKey = op === defaultOp ? definition.key : `${definition.key}~${op}`
              const value = entries.get(urlKey)

              if (value != null) {
                rules.push({
                  key: definition.key,
                  operator: op,
                  value: value as TableQueryStateFilterValue,
                })
                break // first matching operator wins
              }
            }
          }

          return rules
        },

        serialize(rules, definitions) {
          const result = new Map<string, unknown>()

          for (const rule of rules) {
            const filter = definitions.find((f) => f.key === rule.key)
            if (!filter) continue

            const definition = normalizeFilterDefinition(filter)
            const operator: TableFilterOperator =
              rule.operator ?? resolveFilterDefaultOperator(definition)
            const defaultOp = resolveFilterDefaultOperator(definition)
            const urlKey = operator === defaultOp ? definition.key : `${definition.key}~${operator}`

            result.set(urlKey, rule.value)
          }

          return result
        },
      }),
    },
    historyMode: 'push',
  })

  return {
    pagination,
    sorting,
    filters,
  }
}
