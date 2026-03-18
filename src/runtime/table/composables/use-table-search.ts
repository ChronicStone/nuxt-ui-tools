import { computed, ref, watch, type ComputedRef } from 'vue'

import type { TableSchemaView } from '../types'
import type { useQueryState } from './use-query-state'
import type { UseTableApi } from './use-table-api'

export interface UseTableSearchParams {
  schema: ComputedRef<TableSchemaView>
  queryState: ReturnType<typeof useQueryState>
  api: UseTableApi
}

export function useTableSearch(options: UseTableSearchParams) {
  const searchQuery = ref<string>(String(options.queryState.filters.value.search ?? ''))

  const searchPlaceholder = computed(
    () => options.schema.value.filters?.search?.placeholder ?? 'Search rows…',
  )

  const hasActiveSearch = computed(() => searchQuery.value.trim().length > 0)

  // Sync external → local
  watch(
    () => options.queryState.filters.value.search,
    (value) => {
      const normalizedValue = String(value ?? '')

      if (normalizedValue !== searchQuery.value) {
        searchQuery.value = normalizedValue
      }
    },
  )

  // Sync local → query state immediately (global debounce in use-table-data handles throttling)
  watch(searchQuery, (value) => {
    options.api.setSearch(value)
  })

  return {
    searchQuery,
    searchPlaceholder,
    hasActiveSearch,
  }
}
