import { TableSchemaView } from '@lib/types'
import { useQueries } from '@tanstack/vue-query'
import { computed, ComputedRef } from 'vue'

export interface UseTableContextParams {
  schema: ComputedRef<TableSchemaView>
}

export function useTableContext(params: UseTableContextParams) {
  const contextQueries = computed(() =>
    (params.schema.value.context ?? []).filter((item) => item?.condition?.() ?? true),
  )
  const context = useQueries({
    queries: () => contextQueries.value.map((item) => item.query()),
    combine: (result) =>
      result.map((item, index) => {
        const query = contextQueries.value[index]
        return { key: query.key, ...item }
      }),
  })

  return {
    context,
  }
}
