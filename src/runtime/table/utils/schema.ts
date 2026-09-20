import { computed, toValue } from 'vue'
import type { ComputedRef } from 'vue'

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
    filters: options.queryState.filters.value,
    layout: options.activeLayout,
    pagination: options.queryState.pagination.value,
    sorting: options.queryState.sorting.value
      ? {
          sortDirection: options.queryState.sorting.value.dir,
          sortKey: options.queryState.sorting.value.key,
        }
      : null,
  }
}

export function createPublicQueryState(options: {
  queryState: ReturnType<typeof useTableState>['queryState']
  activeLayout: ComputedRef<TableLayout>
}) {
  return computed<PublicTableQueryState>(() =>
    mapPublicQueryState({
      activeLayout: options.activeLayout.value,
      queryState: options.queryState,
    }),
  )
}
