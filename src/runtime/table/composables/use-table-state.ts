import { computed, type ComputedRef } from 'vue'

import type { TableResolvedFilterGroup, TableSchemaView } from '../types'
import { createResolvedFilterState } from '../utils'
import { useQueryState } from './use-query-state'
import type { useTableLayout } from './use-table-layout'

export interface UseTableStateParams {
  schema: ComputedRef<TableSchemaView>
  layout: ReturnType<typeof useTableLayout>
}

export function useTableState(params: UseTableStateParams) {
  const queryState = useQueryState({
    schema: params.schema,
    activeLayout: params.layout.resolvedLayout,
  })

  const resolvedFilterState = computed<TableResolvedFilterGroup<string>>(() =>
    createResolvedFilterState({
      definitions: params.schema.value.filters?.ui ?? [],
      filters: queryState.filters.value,
      staticFilters: params.schema.value.filters?.static,
    }),
  )

  return {
    activeLayout: params.layout.resolvedLayout,
    queryState,
    resolvedFilterState,
  }
}
