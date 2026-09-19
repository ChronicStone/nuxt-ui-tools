import { computed } from 'vue'
import type { ComputedRef } from 'vue'

import type { TableSchemaView } from '../types'
import { getFilterTextValue } from '../utils/filters/common'
import type { useQueryState } from './use-query-state'

export interface UseTableSearchParams {
  schema: ComputedRef<TableSchemaView>
  queryState: ReturnType<typeof useQueryState>
}

export function useTableSearch(options: UseTableSearchParams) {
  const searchQuery = computed({
    get: () => String(options.queryState.filters.value.search ?? ''),
    set: (value: string) => {
      options.queryState.resetPagination()
      options.queryState.filters.value = {
        ...options.queryState.filters.value,
        search: value,
      }
    },
  })

  const searchPlaceholder = computed(() =>
    getFilterTextValue({
      fallback: 'Search rows…',
      value: options.schema.value.filters?.search?.placeholder,
    }),
  )

  const hasActiveSearch = computed(() => searchQuery.value.trim().length > 0)

  return {
    hasActiveSearch,
    searchPlaceholder,
    searchQuery,
  }
}
