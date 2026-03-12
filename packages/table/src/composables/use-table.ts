import { computed, type ComputedRef } from 'vue'

import type {
  ExtractTableContextData,
  ExtractTableFilterKey,
  ExtractTablePageContextData,
  ExtractTableRow,
  MaybeComputedRef,
  TableFilterState,
  TableLayout,
  TableResolvedFilterGroup,
  TableSchemaView,
} from '../types'
import { createResolvedFilterState } from '../utils'
import { useQueryState } from './use-query-state'
import { type UseTableApi, useTableApi } from './use-table-api'
import { useTableLayout } from './use-table-layout'

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
  resolvedFilterState: ComputedRef<TableResolvedFilterGroup<ExtractTableFilterKey<TSchema>>>
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
  const queryState = useQueryState({
    schema: schemaView,
    activeLayout: computed(
      () => layout.activeLayout.value ?? schemaView.value.defaultLayout ?? 'table',
    ),
  })
  const api = useTableApi({
    schema: schemaView,
    activeLayout: layout.activeLayout,
    pagination: queryState.pagination,
    sorting: queryState.sorting,
    filters: queryState.filters,
  }) as UseTableApi<TSchema>
  const resolvedFilterState = computed(() =>
    createResolvedFilterState({
      definitions: schemaView.value.filters?.ui ?? [],
      filters: queryState.filters.value,
      staticFilters: schemaView.value.filters?.static,
    }),
  ) as ComputedRef<TableResolvedFilterGroup<ExtractTableFilterKey<TSchema>>>

  return {
    schema: resolvedSchema,
    options,
    layout: computed(() => layout.activeLayout.value ?? schemaView.value.defaultLayout ?? 'table'),
    queryState: computed(() => ({
      layout: layout.activeLayout.value ?? schemaView.value.defaultLayout ?? 'table',
      pagination: queryState.pagination.value,
      sorting: queryState.sorting.value
        ? {
            sortKey: queryState.sorting.value.key,
            sortDirection: queryState.sorting.value.dir,
          }
        : null,
      filters: queryState.filters.value,
    })),
    resolvedFilterState,
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
