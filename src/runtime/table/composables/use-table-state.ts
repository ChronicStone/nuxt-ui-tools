import { computed } from 'vue'
import type { ComputedRef } from 'vue'

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
    activeLayout: params.layout.activeLayout,
    schema: params.schema,
  })

  const resolvedFilterState = computed<TableResolvedFilterGroup<string>>(() =>
    createResolvedFilterState({
      definitions: params.schema.value.filters?.ui ?? [],
      filters: queryState.filters.value,
      staticFilters: params.schema.value.filters?.static,
    }),
  )

  return {
    queryState,
    resolvedFilterState,
  }
}
