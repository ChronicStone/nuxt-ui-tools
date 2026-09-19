import { computed, ref } from 'vue'
import type { ComputedRef } from 'vue'

import {
  useQueryStates,
  dynamicQueryState,
  numberCodec,
  stringCodec,
  createEnumCodec,
} from '#ui-tools/query-state'

import { isObject } from '../../shared/utils/predicate'
import type {
  TableLayout,
  TableQueryStateFilterRule,
  TableSchemaView,
  TableUiFilterDefinition,
} from '../types'
import {
  createTableFilterValueCodec,
  getDefaultPageSize,
  getDefaultSort,
  getPaginationMode,
  normalizeFilterDefinition,
  parseTableFilterQueryState,
  resolveTableFilterDefaultRules,
  resolveFilterDefaultOperator,
  resolveFilterSupportedOperators,
  serializeTableFilterQueryState,
} from '../utils'

export interface UseQueryStateParams {
  schema: ComputedRef<TableSchemaView>
  activeLayout: ComputedRef<TableLayout>
}

export function useQueryState(params: UseQueryStateParams) {
  const defaultPageSize = getDefaultPageSize({
    layout: params.activeLayout.value,
    schema: params.schema.value,
  })

  const defaultSort = getDefaultSort({
    layout: params.activeLayout.value,
    schema: params.schema.value,
  })

  // ---------------------------------------------------------------------------
  // Pagination — URL keys: p.page, p.size
  // ---------------------------------------------------------------------------

  const paginationMode = getPaginationMode(params.schema.value)
  const paginationRevision = ref<number>(0)
  const offsetPagination =
    paginationMode === 'offset'
      ? useQueryStates({
          historyMode: 'push',
          prefix: 'p',
          schema: {
            pageIndex: { codec: numberCodec, defaultValue: 1, urlKey: 'page' },
            pageSize: { codec: numberCodec, defaultValue: defaultPageSize, urlKey: 'size' },
          },
        })
      : null
  const pagination = computed(() => {
    if (paginationMode === 'none') {
      return { mode: 'none' } as const
    }
    if (paginationMode === 'cursor') {
      return {
        count:
          params.schema.value.pagination &&
          isObject(params.schema.value.pagination) &&
          'mode' in params.schema.value.pagination &&
          params.schema.value.pagination.mode === 'cursor'
            ? (params.schema.value.pagination.count ?? 'none')
            : 'none',
        cursor: null,
        mode: 'cursor',
        pageSize: defaultPageSize,
      } as const
    }

    return {
      count: 'exact',
      mode: 'offset',
      pageIndex: offsetPagination?.value.pageIndex ?? 1,
      pageSize: offsetPagination?.value.pageSize ?? defaultPageSize,
    } as const
  })

  function resetPagination() {
    if (paginationMode === 'cursor') {
      paginationRevision.value++
      return
    }
    if (!offsetPagination) {
      return
    }
    offsetPagination.value = {
      pageIndex: 1,
      pageSize: offsetPagination.value.pageSize,
    }
  }

  function setOffsetPagination(value: { pageIndex: number; pageSize: number }) {
    if (!offsetPagination) {
      return
    }
    offsetPagination.value = value
  }

  // ---------------------------------------------------------------------------
  // Sorting — URL keys: s.key, s.dir
  // ---------------------------------------------------------------------------

  const sortingState = useQueryStates({
    historyMode: 'push',
    prefix: 's',
    schema: {
      dir: { codec: createEnumCodec(['asc', 'desc']), defaultValue: defaultSort?.dir },
      key: { codec: stringCodec, defaultValue: defaultSort?.key ?? '' },
    },
  })

  // Domain mapping: empty key → null (consumers expect nullable sorting)
  const sorting = computed({
    get() {
      const { key, dir } = sortingState.value
      if (!key) {
        return null
      }
      return { dir: dir ?? 'asc', key }
    },
    set(value: { key: string; dir: 'asc' | 'desc' } | null) {
      sortingState.value = value ? { dir: value.dir, key: value.key } : { dir: undefined, key: '' }
    },
  })

  // ---------------------------------------------------------------------------
  // Filters — URL keys: f.search, f.ui.{key}, f.ui.{key}~{operator}
  // ---------------------------------------------------------------------------

  const filters = useQueryStates({
    historyMode: 'push',
    prefix: 'f',
    schema: {
      search: { codec: stringCodec, defaultValue: '' },
      ui: dynamicQueryState<TableUiFilterDefinition, TableQueryStateFilterRule[]>({
        defaultValue: resolveTableFilterDefaultRules(params.schema.value.filters?.ui ?? []),
        definitions: () => params.schema.value.filters?.ui ?? [],
        parse(entries, definitions) {
          return parseTableFilterQueryState({ entries, definitions })
        },
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
        serialize(rules, definitions) {
          return serializeTableFilterQueryState({ rules, definitions })
        },
        urlPrefix: 'ui',
      }),
    },
  })

  return {
    filters,
    pagination,
    paginationMode,
    paginationRevision,
    resetPagination,
    setOffsetPagination,
    sorting,
  }
}
