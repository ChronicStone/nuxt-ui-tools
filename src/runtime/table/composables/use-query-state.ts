import { computed, ref, type ComputedRef } from 'vue'

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

  const paginationMode = getPaginationMode(params.schema.value)
  const paginationRevision = ref<number>(0)
  const offsetPagination =
    paginationMode === 'offset'
      ? useQueryStates({
          prefix: 'p',
          schema: {
            pageIndex: { urlKey: 'page', codec: numberCodec, defaultValue: 1 },
            pageSize: { urlKey: 'size', codec: numberCodec, defaultValue: defaultPageSize },
          },
          historyMode: 'push',
        })
      : null
  const pagination = computed(() => {
    if (paginationMode === 'none') return { mode: 'none' } as const
    if (paginationMode === 'cursor')
      return {
        mode: 'cursor',
        cursor: null,
        pageSize: defaultPageSize,
        count:
          params.schema.value.pagination &&
          isObject(params.schema.value.pagination) &&
          'mode' in params.schema.value.pagination &&
          params.schema.value.pagination.mode === 'cursor'
            ? (params.schema.value.pagination.count ?? 'none')
            : 'none',
      } as const

    return {
      mode: 'offset',
      pageIndex: offsetPagination?.value.pageIndex ?? 1,
      pageSize: offsetPagination?.value.pageSize ?? defaultPageSize,
      count: 'exact',
    } as const
  })

  function resetPagination() {
    if (paginationMode === 'cursor') {
      paginationRevision.value++
      return
    }
    if (!offsetPagination) return
    offsetPagination.value = {
      pageIndex: 1,
      pageSize: offsetPagination.value.pageSize,
    }
  }

  function setOffsetPagination(value: { pageIndex: number; pageSize: number }) {
    if (!offsetPagination) return
    offsetPagination.value = value
  }

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
        defaultValue: resolveTableFilterDefaultRules(params.schema.value.filters?.ui ?? []),

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
          return parseTableFilterQueryState({ entries, definitions })
        },

        serialize(rules, definitions) {
          return serializeTableFilterQueryState({ rules, definitions })
        },
      }),
    },
    historyMode: 'push',
  })

  return {
    pagination,
    paginationMode,
    paginationRevision,
    resetPagination,
    setOffsetPagination,
    sorting,
    filters,
  }
}
