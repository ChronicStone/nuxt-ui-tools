import { getFilterTextValue } from '../utils'
import { computed, type ComputedRef } from 'vue'

import type { TableSchemaView } from '../types'
import type { useQueryState } from './use-query-state'

export interface UseTableSearchParams {
  schema: ComputedRef<TableSchemaView>
  queryState: ReturnType<typeof useQueryState>
}

export function useTableSearch(options: UseTableSearchParams) {
  const searchQuery = computed({
    get: () => String(options.queryState.filters.value.search ?? ''),
    set: (value: string) => {
      options.queryState.pagination.value.pageIndex = 1
      options.queryState.filters.value.search = value
    },
  })

  const searchPlaceholder = computed(
    () => getFilterTextValue({
      value: options.schema.value.filters?.search?.placeholder,
      fallback: 'Search rows…',
    }),
  )

  const hasActiveSearch = computed(() => searchQuery.value.trim().length > 0)

  return {
    searchQuery,
    searchPlaceholder,
    hasActiveSearch,
  }
}
