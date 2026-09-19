import { computed, inject, provide, shallowRef } from 'vue'
import type { InjectionKey } from 'vue'

import type { MaybeComputedRef, TableApi, TableSchemaView } from '../types'
import { resolveSchemaSource } from '../utils'
import { useTableActions } from './use-table-actions'
import { useTableApi } from './use-table-api'
import { useTableColumns } from './use-table-columns'
import { useTableControls } from './use-table-controls'
import { useTableData } from './use-table-data'
import { useTableFilterPresentation } from './use-table-filter-presentation'
import { useTableFilters } from './use-table-filters'
import { useTableGrid } from './use-table-grid'
import { useTableLayout } from './use-table-layout'
import { useTablePagination } from './use-table-pagination'
import { useTableSelection } from './use-table-selection'
import { useTableStartup } from './use-table-startup'
import { useTableState } from './use-table-state'
import { useTableSummaries } from './use-table-summaries'

function createTableInternals<TSchema>(options: { rawSchema: MaybeComputedRef<TSchema> }) {
  const publicSchema = computed<TSchema>(() => resolveSchemaSource({ schema: options.rawSchema }))
  // SAFETY: the runtime consumes the normalized table contract while publicSchema preserves caller inference.
  const schema = computed(() => publicSchema.value as TableSchemaView)
  const tableApi = shallowRef<TableApi<TSchema> | null>(null)
  const startup = useTableStartup()
  const layout = useTableLayout({ schema })
  const state = useTableState({
    layout,
    schema,
  })
  const queryContent = useTableData({
    schema,
    startup,
    state,
  })
  const selection = useTableSelection({
    queryContent,
    schema,
  })
  const controls = useTableControls({
    layout,
    schema,
  })
  const filters = useTableFilters({
    queryContent,
    schema,
    state,
  })
  const filterPresentation = useTableFilterPresentation({
    filters,
  })
  const grid = useTableGrid({
    data: queryContent.data,
    schema,
  })
  const tableColumns = useTableColumns({
    data: queryContent,
    schema,
    selection,
    state,
    tableApi,
    tableLayout: controls.tableLayout,
  })
  const summaries = useTableSummaries({
    queryContent,
    runtimeColumns: tableColumns.runtimeColumns,
    schema,
    selection,
  })
  const pagination = useTablePagination({
    layout,
    queryContent,
    schema,
    state,
  })

  tableApi.value = useTableApi<TSchema>({
    columns: tableColumns,
    controls,
    filters,
    layout,
    pagination,
    publicSchema,
    queryContent,
    runtimeSchema: schema,
    selection,
    state,
  })

  if (!tableApi.value) {
    throw new Error('Failed to initialize table API')
  }

  const actions = useTableActions({
    queryContent,
    schema,
    selection,
    tableApi,
  })

  return {
    actions,
    controls,
    filterPresentation,
    filters,
    grid,
    layout,
    pagination,
    queryContent,
    queryState: state.queryState,
    resolvedFilterState: state.resolvedFilterState,
    schema,
    selection,
    startup,
    summaries,
    tableApi: tableApi.value,
    tableColumns,
  }
}

// SAFETY: the injection key is private to this module and every provider uses the same TableInternals contract.
const TABLE_INTERNALS_KEY = Symbol('nuxt-ui-tools.table.internals') as InjectionKey<TableInternals>

function provideTableInternals(internals: TableInternals) {
  provide(TABLE_INTERNALS_KEY, internals)
}

function useProvideTableInternals<TSchema>(options: { rawSchema: MaybeComputedRef<TSchema> }) {
  const internals = createTableInternals(options)
  provideTableInternals(internals)
  return internals
}

function useTableInternals() {
  const internals = inject(TABLE_INTERNALS_KEY, null)
  if (!internals) {
    throw new Error('useTableInternals must be called inside a <DataList> component')
  }
  return internals
}

export type TableInternals = ReturnType<typeof createTableInternals>

export { createTableInternals, provideTableInternals, useProvideTableInternals, useTableInternals }
