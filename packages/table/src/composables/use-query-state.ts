import { computed, type ComputedRef } from 'vue'
import {
  createEnumCodec,
  numberCodec,
  queryReactive,
  queryRef,
} from 'vue-qs'

import type { TableFilterState, TableLayout, TableSchemaView } from '../types'
import {
  createUiFilterQuerySchema,
  createSortKeyCodec,
  getDefaultPageSize,
  getDefaultSort,
  getUiFilterRulesFromQueryState,
  getSortKeys,
  setUiFilterRulesToQueryState,
} from '../utils'

export interface UseQueryStateParams {
  schema: ComputedRef<TableSchemaView>
  activeLayout: ComputedRef<TableLayout>
}

export function useQueryState(params: UseQueryStateParams) {
  const uiFilterDefinitions = params.schema.value.filters?.ui ?? []

  const pageIndex = queryRef('p.page', {
    shouldOmitDefault: true,
    defaultValue: 1,
    codec: numberCodec,
  })

  const pageSize = queryRef('p.size', {
    shouldOmitDefault: true,
    defaultValue: getDefaultPageSize({
      schema: params.schema.value,
      layout: params.activeLayout.value,
    }),
    codec: numberCodec,
  })

  const sortKey = queryRef('s.key', {
    shouldOmitDefault: true,
    defaultValue: getDefaultSort({
      schema: params.schema.value,
      layout: params.activeLayout.value,
    })?.key,
    codec: createSortKeyCodec(
      getSortKeys({
        schema: params.schema.value,
        layout: params.activeLayout.value,
      }),
    ),
  })

  const sortDirection = queryRef('s.dir', {
    shouldOmitDefault: true,
    defaultValue: getDefaultSort({
      schema: params.schema.value,
      layout: params.activeLayout.value,
    })?.dir,
    codec: createEnumCodec(['asc', 'desc'] as const),
  })

  const searchQuery = queryRef('f.search', {
    defaultValue: '',
  })

  const uiFilters = queryReactive(createUiFilterQuerySchema(uiFilterDefinitions))

  const filters = computed<TableFilterState>({
    get() {
      return {
        search: searchQuery.value,
        ui: getUiFilterRulesFromQueryState(uiFilterDefinitions, uiFilters),
      }
    },
    set(value) {
      searchQuery.value = value.search
      setUiFilterRulesToQueryState(uiFilterDefinitions, uiFilters, value.ui)
    },
  })

  const sorting = computed({
    get() {
      if (!sortKey.value) return null

      return {
        key: sortKey.value,
        dir: sortDirection.value ?? 'asc',
      }
    },
    set(value) {
      if (!value) {
        sortKey.value = undefined
        sortDirection.value = undefined
        return
      }

      sortKey.value = value.key
      sortDirection.value = value.dir
    },
  })

  const pagination = computed({
    get() {
      return {
        pageIndex: pageIndex.value,
        pageSize: pageSize.value,
      }
    },
    set(value) {
      pageIndex.value = value.pageIndex
      pageSize.value = value.pageSize
    },
  })


  return {
    pagination,
    sorting,
    filters,
  }
}
