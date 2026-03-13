import { computed, type ComputedRef } from 'vue'

import type { TableLayout, TableResolvedFilterGroup, TableSchemaView } from '../types'
import { createResolvedFilterState } from '../utils'
import { useQueryState } from './use-query-state'

export interface UseTableStateParams {
  schema: ComputedRef<TableSchemaView>
  activeLayout: ComputedRef<TableLayout>
}

export function useTableState(params: UseTableStateParams) {
  const queryState = useQueryState({
    schema: params.schema,
    activeLayout: params.activeLayout,
  })

  const resolvedFilterState = computed(() =>
    createResolvedFilterState({
      definitions: (params.schema.value.filters?.ui ?? []) as any,
      filters: queryState.filters.value,
      staticFilters: params.schema.value.filters?.static,
    }),
  ) as ComputedRef<TableResolvedFilterGroup<string>>

  return {
    queryState,
    resolvedFilterState,
  }
}
