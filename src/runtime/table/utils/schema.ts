import { computed, toValue, type ComputedRef } from 'vue'

import type { useTableState } from '../composables/use-table-state'
import type { MaybeComputedRef, PublicTableQueryState, TableLayout } from '../types'

export function resolveSchemaSource<TSchema>(options: {
  schema: MaybeComputedRef<TSchema>
}): TSchema {
  return toValue(options.schema)
}

export function mapPublicQueryState(options: {
  queryState: ReturnType<typeof useTableState>['queryState']
  activeLayout: TableLayout
}): PublicTableQueryState {
  return {
    layout: options.activeLayout,
    pagination: options.queryState.pagination.value,
    sorting: options.queryState.sorting.value
      ? {
          sortKey: options.queryState.sorting.value.key,
          sortDirection: options.queryState.sorting.value.dir,
        }
      : null,
    filters: options.queryState.filters.value,
  }
}

export function createPublicQueryState(options: {
  queryState: ReturnType<typeof useTableState>['queryState']
  activeLayout: ComputedRef<TableLayout>
}) {
  return computed<PublicTableQueryState>(() =>
    mapPublicQueryState({
      queryState: options.queryState,
      activeLayout: options.activeLayout.value,
    }),
  )
}
