import { computed, type ComputedRef } from 'vue'

import type {
  ExtractTableContextData,
  ExtractTablePageContextData,
  ExtractTableRow,
  MaybeComputedRef,
  TableFilterState,
  TableLayout,
  TableResolvedFilterGroup,
  TableSchemaView,
} from '../types'
import { useTableData } from './use-table-data'
import { type UseTableApi, useTableApi } from './use-table-api'
import { useTableLayout } from './use-table-layout'
import { useTableState } from './use-table-state'

export interface UseTableOptions {}

export interface UseTableQueryState {
  layout: TableLayout
  pagination: { pageIndex: number; pageSize: number }
  sorting: { sortKey: string; sortDirection: 'asc' | 'desc' } | null
  filters: TableFilterState
}

export interface UseTableReturn<TSchema = TableSchemaView> {
  schema: ComputedRef<TSchema>
  options?: UseTableOptions
  layout: ComputedRef<TableLayout>
  queryState: ComputedRef<UseTableQueryState>
  resolvedFilterState: ComputedRef<TableResolvedFilterGroup<string>>
  data: ReturnType<typeof useTableData>
  api: UseTableApi<TSchema>
  types: {
    row?: ExtractTableRow<TSchema>
    context?: ExtractTableContextData<TSchema>
    pageContext?: ExtractTablePageContextData<TSchema>
  }
}

export function useTable<TSchema = TableSchemaView>(
  schema: MaybeComputedRef<TSchema>,
  options?: UseTableOptions,
): UseTableReturn<TSchema> {
  const resolvedSchema = computed(() => resolveSchemaSource(schema))
  const schemaView = computed(() => resolvedSchema.value as unknown as TableSchemaView)
  const layout = useTableLayout({ schema: schemaView })
  const state = useTableState({
    schema: schemaView,
    activeLayout: computed(
      () => layout.activeLayout.value ?? schemaView.value.defaultLayout ?? 'table',
    ),
  })
  const api = useTableApi({
    schema: schemaView,
    activeLayout: layout.activeLayout,
    pagination: state.queryState.pagination,
    sorting: state.queryState.sorting,
    filters: state.queryState.filters,
  }) as UseTableApi<TSchema>
  const data = useTableData({
    schema: schemaView,
    state,
  })

  return {
    schema: resolvedSchema,
    options,
    layout: computed(() => layout.activeLayout.value ?? schemaView.value.defaultLayout ?? 'table'),
    queryState: computed(() => ({
      layout: layout.activeLayout.value ?? schemaView.value.defaultLayout ?? 'table',
      pagination: state.queryState.pagination.value,
      sorting: state.queryState.sorting.value
        ? {
            sortKey: state.queryState.sorting.value.key,
            sortDirection: state.queryState.sorting.value.dir,
          }
        : null,
      filters: state.queryState.filters.value,
    })),
    resolvedFilterState: state.resolvedFilterState,
    data,
    api,
    types: {},
  }
}

function resolveSchemaSource<TSchema>(schema: MaybeComputedRef<TSchema>): TSchema {
  if (typeof schema === 'function') {
    return (schema as () => TSchema)()
  }

  if (schema && typeof schema === 'object' && 'value' in schema) {
    return schema.value as TSchema
  }

  return schema as TSchema
}
