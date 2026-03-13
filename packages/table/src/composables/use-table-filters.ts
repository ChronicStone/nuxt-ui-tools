import { Debouncer } from '@tanstack/pacer'
import { computed, onBeforeUnmount, ref, watch } from 'vue'

export function useTableFilters(options: {
  schema: any
  queryState: any
  api: any
}) {
  const searchQuery = ref(String(options.queryState.filters.value.search ?? ''))
  const searchPlaceholder = computed(
    () => options.schema.value.filters?.search?.placeholder ?? 'Search rows…',
  )
  const searchDebounce = computed(
    () => Math.max(0, options.schema.value.filters?.search?.debounce ?? 260),
  )

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
  }
}
