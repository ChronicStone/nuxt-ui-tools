import { createInjectionState } from '@vueuse/core'
import { computed, ref } from 'vue'

import type { MaybeComputedRef, TableLayout, TableSchemaView } from '../types'
import { createDefaultColumnState, createPublicQueryState, resolveSchemaSource, type TableColumnState } from '../utils'
import { useTableColumns } from './use-table-columns'
import { useTableControls } from './use-table-controls'
import { useTableData } from './use-table-data'
import { useTableFilters } from './use-table-filters'
import { useTablePagination } from './use-table-pagination'
import { useTableApi } from './use-table-api'
import { useTableLayout } from './use-table-layout'
import { useTableSelection } from './use-table-selection'
import { useTableState } from './use-table-state'

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
  const tableState = ref<TableColumnState>(createDefaultColumnState())
  const selection = useTableSelection({
    schema,
    rows: computed(() => queryContent.data.value.rows),
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
    queryContent,
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

export type TableInternals = ReturnType<typeof createTableInternals>

export { useProvideTableInternals, useTableInternals }
