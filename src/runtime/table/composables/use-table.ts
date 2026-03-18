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
import { createPublicQueryState, resolveSchemaSource } from '../utils'
import type { UseTableApi } from './use-table-api'
import { useTableData } from './use-table-data'
import { useProvideTableInternals } from './use-table-internals'

export type UseTableOptions = Record<string, never>
export type PublicTableQueryState = {
  layout: TableLayout
  pagination: { pageIndex: number; pageSize: number }
  sorting: { sortKey: string; sortDirection: 'asc' | 'desc' } | null
  filters: TableFilterState
}

export type UseTableReturn<TSchema = TableSchemaView> = {
  schema: ComputedRef<TSchema>
  options?: UseTableOptions
  layout: ComputedRef<TableLayout>
  queryState: ComputedRef<PublicTableQueryState>
  resolvedFilterState: ComputedRef<TableResolvedFilterGroup<string>>
  state: {
    layout: ComputedRef<TableLayout>
    query: ComputedRef<PublicTableQueryState>
    resolvedFilters: ComputedRef<TableResolvedFilterGroup<string>>
    selection: {
      selectedKeys: ComputedRef<string[]>
      selectedCount: ComputedRef<number>
      allSelected: ComputedRef<boolean>
      partiallySelected: ComputedRef<boolean>
    }
  }
  selection: {
    selectedKeys: ComputedRef<string[]>
    selectedCount: ComputedRef<number>
    allSelected: ComputedRef<boolean>
    partiallySelected: ComputedRef<boolean>
  }
  data: {
    rows: ComputedRef<ExtractTableRow<TSchema>[]>
    rowCount: ComputedRef<number>
    rawRows: ComputedRef<ExtractTableRow<TSchema>[]>
    rawRowCount: ComputedRef<number>
    context: ComputedRef<ExtractTableContextData<TSchema>>
    pageContext: ComputedRef<ExtractTablePageContextData<TSchema>>
    requestContext: ReturnType<typeof useTableData>['requestContext']
    error: ReturnType<typeof useTableData>['error']
    status: ReturnType<typeof useTableData>['status']
    data: ReturnType<typeof useTableData>['data']
    rawData: ReturnType<typeof useTableData>['rawData']
    contextData: ReturnType<typeof useTableData>['contextData']
    pageContextData: ReturnType<typeof useTableData>['pageContextData']
  }
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
) {
  const resolvedSchema = computed(() => resolveSchemaSource({ schema }))
  const internals = useProvideTableInternals({
    rawSchema: computed(() => resolvedSchema.value as unknown as TableSchemaView),
  })
  const queryState = createPublicQueryState({
    queryState: internals.queryState,
    activeLayout: internals.activeLayout,
  })
  const api = internals.tableApi as UseTableApi<TSchema>

  const publicTable = {
    schema: resolvedSchema,
    options,
    layout: internals.activeLayout,
    queryState,
    resolvedFilterState: internals.resolvedFilterState,
    state: {
      layout: internals.activeLayout,
      query: queryState,
      resolvedFilters: internals.resolvedFilterState,
      selection: {
        selectedKeys: computed(() => internals.selection.selectedKeys.value),
        selectedCount: internals.selection.selectedCount,
        allSelected: internals.selection.allSelected,
        partiallySelected: internals.selection.partiallySelected,
      },
    },
    selection: {
      selectedKeys: computed(() => internals.selection.selectedKeys.value),
      selectedCount: internals.selection.selectedCount,
      allSelected: internals.selection.allSelected,
      partiallySelected: internals.selection.partiallySelected,
    },
    data: {
      rows: computed(() => internals.queryContent.data.value.rows as ExtractTableRow<TSchema>[]),
      rowCount: computed(() => internals.queryContent.data.value.rowCount),
      rawRows: computed(
        () => internals.queryContent.rawData.value.rows as ExtractTableRow<TSchema>[],
      ),
      rawRowCount: computed(() => internals.queryContent.rawData.value.rowCount),
      context: computed(
        () => internals.queryContent.contextData.value as ExtractTableContextData<TSchema>,
      ),
      pageContext: computed(
        () => internals.queryContent.pageContextData.value as ExtractTablePageContextData<TSchema>,
      ),
      requestContext: internals.queryContent.requestContext,
      error: internals.queryContent.error,
      status: internals.queryContent.status,
      data: internals.queryContent.data,
      rawData: internals.queryContent.rawData,
      contextData: internals.queryContent.contextData,
      pageContextData: internals.queryContent.pageContextData,
    },
    api,
    types: {},
  }

  return publicTable
}
