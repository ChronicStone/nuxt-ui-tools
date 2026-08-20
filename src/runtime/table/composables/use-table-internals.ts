import { computed, inject, provide, shallowRef, type InjectionKey } from 'vue'

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

function createTableInternals<TSchema>(options: { rawSchema: MaybeComputedRef<TSchema> }) {
  const publicSchema = computed<TSchema>(() => resolveSchemaSource({ schema: options.rawSchema }))
  // SAFETY: the runtime consumes the normalized table contract while publicSchema preserves caller inference.
  const schema = computed(() => publicSchema.value as TableSchemaView)
  const tableApi = shallowRef<TableApi<TSchema> | null>(null)
  const startup = useTableStartup()
  const layout = useTableLayout({ schema })
  const state = useTableState({
    schema,
    layout,
  })
  const queryContent = useTableData({
    schema,
    state,
    startup,
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
  const filterPresentation = useTableFilterPresentation({
    filters,
  })
  const grid = useTableGrid({
    schema,
    data: queryContent.data,
  })
  const tableColumns = useTableColumns({
    schema,
    state,
    data: queryContent,
    selection,
    tableLayout: controls.tableLayout,
    tableApi,
  })
  const pagination = useTablePagination({
    schema,
    layout,
    state,
    queryContent,
  })

  tableApi.value = useTableApi<TSchema>({
    runtimeSchema: schema,
    publicSchema,
    layout,
    state,
    selection,
    controls,
    columns: tableColumns,
    filters,
    pagination,
    queryContent,
  })

  if (!tableApi.value) throw new Error('Failed to initialize table API')

  const actions = useTableActions({
    schema,
    queryContent,
    selection,
    tableApi,
  })

  return {
    schema,
    layout,
    startup,
    queryState: state.queryState,
    resolvedFilterState: state.resolvedFilterState,
    queryContent,
    tableApi: tableApi.value,
    actions,
    selection,
    filters,
    filterPresentation,
    grid,
    controls,
    tableColumns,
    pagination,
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
  if (!internals) throw new Error('useTableInternals must be called inside a <DataList> component')
  return internals
}

export type TableInternals = ReturnType<typeof createTableInternals>

export { createTableInternals, provideTableInternals, useProvideTableInternals, useTableInternals }
