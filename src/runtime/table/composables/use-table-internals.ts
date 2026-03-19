import { createInjectionState } from '@vueuse/core'
import { computed, shallowRef } from 'vue'

import type { MaybeComputedRef, TableApi, TableSchemaView } from '../types'
import { resolveSchemaSource } from '../utils'
import { useTableApi } from './use-table-api'
import { useTableColumns } from './use-table-columns'
import { useTableControls } from './use-table-controls'
import { useTableData } from './use-table-data'
import { useTableFilters } from './use-table-filters'
import { useTableLayout } from './use-table-layout'
import { useTablePagination } from './use-table-pagination'
import { useTableSelection } from './use-table-selection'
import { useTableState } from './use-table-state'

function createTableInternals<TSchema extends TableSchemaView>(options: {
  rawSchema: MaybeComputedRef<TSchema>
}) {
  const schema = computed(() => resolveSchemaSource({ schema: options.rawSchema }))
  const tableApi = shallowRef<TableApi<TSchema> | null>(null)
  const layout = useTableLayout({ schema })
  const state = useTableState({
    schema,
    layout,
  })
  const queryContent = useTableData({
    schema,
    state,
  })
  const selection = useTableSelection({
    schema,
    queryContent,
  })
  const controls = useTableControls({
    schema,
    layout,
  })
  const filters = useTableFilters({
    schema,
    state,
    queryContent,
  })
  const tableColumns = useTableColumns({
    schema,
    state,
    data: queryContent,
    selection,
    tableLayout: controls.tableLayout,
  })
  const pagination = useTablePagination({
    schema,
    layout,
    state,
    queryContent,
  })

  tableApi.value = useTableApi({
    schema,
    layout,
    state,
    selection,
    controls,
    columns: tableColumns,
    pagination,
    queryContent,
  })

  if (!tableApi.value) {
    throw new Error('Failed to initialize table API')
  }

  return {
    schema,
    layout,
    queryState: state.queryState,
    resolvedFilterState: state.resolvedFilterState,
    queryContent,
    tableApi: tableApi.value,
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
