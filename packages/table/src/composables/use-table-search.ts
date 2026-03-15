import { Debouncer } from '@tanstack/pacer'
import { computed, onBeforeUnmount, ref, watch, type ComputedRef } from 'vue'

import type { TableSchemaView } from '../types'
import type { UseTableApi } from './use-table-api'
import type { useQueryState } from './use-query-state'

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

  const searchDebounce = computed(
    () => Math.max(0, options.schema.value.filters?.search?.debounce ?? 260),
  )

  const hasActiveSearch = computed(() => searchQuery.value.trim().length > 0)

  const searchDebouncer = new Debouncer(
    (value: string) => {
      options.api.setSearch(value)
    },
    {
      wait: searchDebounce.value,
    },
  )

  watch(
    () => options.queryState.filters.value.search,
    (value) => {
      const normalizedValue = String(value ?? '')

      if (normalizedValue !== searchQuery.value) {
        searchQuery.value = normalizedValue
      }
    },
  )

  watch(searchDebounce, (wait) => {
    searchDebouncer.setOptions({ wait })
  })

  watch(searchQuery, (value) => {
    searchDebouncer.maybeExecute(value)
  })

  onBeforeUnmount(() => {
    searchDebouncer.cancel()
  })

  return {
    searchQuery,
    searchPlaceholder,
    searchDebounce,
    searchDebouncer,
    hasActiveSearch,
  }
}
