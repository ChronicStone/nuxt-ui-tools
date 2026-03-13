import { createInjectionState } from '@vueuse/core'
import { computed, ref, type ComputedRef } from 'vue'

import type { MaybeComputedRef, TableLayout, TableSchemaView } from '../types'
import { useTableColumns } from './use-table-columns'
import { useTableControls } from './use-table-controls'
import { useTableData } from './use-table-data'
import { useTableFilters } from './use-table-filters'
import { useTablePagination } from './use-table-pagination'
import { useTableApi } from './use-table-api'
import { useTableLayout } from './use-table-layout'
import { useTableRows } from './use-table-rows'
import { useTableSelection } from './use-table-selection'
import { useTableState } from './use-table-state'

export interface TableRuntimeColumn {
  id: string
  label: string
  icon?: string
  sortableKey?: string
  canHide: boolean
  defaultVisible: boolean
}

function createTableInternals(options: {
  rawSchema: MaybeComputedRef<TableSchemaView>
}) {
  const schema = computed(() => resolveSchemaSource({ schema: options.rawSchema }))
  const layout = useTableLayout({ schema })
  const activeLayout = computed<TableLayout>(
    () => layout.activeLayout.value ?? schema.value.defaultLayout ?? 'table',
  )
  const state = useTableState({
    schema,
    activeLayout,
  })
  const queryState = state.queryState
  const resolvedFilterState = state.resolvedFilterState
  const queryContent = useTableData({
    schema,
    state: {
      queryState,
      resolvedFilterState,
    },
  })
  const tableState = ref<Record<string, any>>({
    columnOrder: [],
    columnVisibility: {},
    columnPinning: { left: [], right: [] },
    columnSizing: {},
    columnSizingInfo: {},
    sorting: [],
  })
  const rows = useTableRows({
    schema,
    rows: computed(() => queryContent.data.value.rows),
  })
  const selection = useTableSelection({
    schema,
    rows,
  })
  const tableApi = useTableApi({
    schema,
    activeLayout: layout.activeLayout,
    pagination: queryState.pagination,
    sorting: queryState.sorting,
    filters: queryState.filters,
    selection,
  })
  const filters = useTableFilters({
    schema,
    queryState,
    api: tableApi,
  })
  const controls = useTableControls({
    schema,
    activeLayout,
  })
  const tableColumns = useTableColumns({
    schema,
    data: queryContent,
    query: createPublicQueryState({ queryState, activeLayout }),
    api: tableApi,
    selection,
    tableLayout: activeLayout,
    tableState,
  })
  const pagination = useTablePagination({
    rowCount: computed(() => queryContent.data.value.rowCount),
    pagination: queryState.pagination,
    api: tableApi,
  })

  return {
    schema,
    layout,
    activeLayout,
    queryState,
    resolvedFilterState,
    queryContent,
    tableApi,
    selection,
    filters,
    controls,
    tableColumns,
    pagination,
    rows,
  }
}

const [useProvideTableInternals, injectTableInternals] = createInjectionState(createTableInternals)

function useTableInternals() {
  const internals = injectTableInternals()

  if (!internals) {
    throw new Error('useTableInternals must be called inside a <DataList> component')
  }

  return internals
}

function resolveSchemaSource<TSchema>(options: {
  schema: MaybeComputedRef<TSchema>
}): TSchema {
  if (typeof options.schema === 'function') {
    return (options.schema as () => TSchema)()
  }

  if (options.schema && typeof options.schema === 'object' && 'value' in options.schema) {
    return options.schema.value as TSchema
  }

  return options.schema as TSchema
}

function createPublicQueryState(
  options: {
    queryState: ReturnType<typeof useTableState>['queryState']
    activeLayout: ComputedRef<TableLayout>
  },
) {
  return computed(() => ({
    layout: options.activeLayout.value,
    pagination: options.queryState.pagination.value,
    sorting: options.queryState.sorting.value
      ? {
          sortKey: options.queryState.sorting.value.key,
          sortDirection: options.queryState.sorting.value.dir,
        }
      : null,
    filters: options.queryState.filters.value,
  }))
}

export type TableInternals = ReturnType<typeof createTableInternals>

export { useProvideTableInternals, useTableInternals }
