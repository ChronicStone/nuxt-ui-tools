import { computed, type ComputedRef, type Ref, type WritableComputedRef } from 'vue'

import type {
  ExtractTableFilterKey,
  ExtractTableFilterOperator,
  ExtractTableFilterRule,
  ExtractTableFilterValue,
  TableFilterState,
  TableLayout,
  TableSchemaView,
  TableSortingDirection,
  TableSortingRule,
  TableUiFilterDefinition,
} from '../types'
import {
  getDefaultPageSize,
  getDefaultSort,
  getPageSizeOptions,
  getSortKeys,
  normalizeFilterDefinition,
  resolveFilterDefaultOperator,
  resolveFilterSupportedOperators,
} from '../utils'

type TableSelectionApi = {
  clearSelection: () => void
  selectAllRows: () => void
  selectRows: (params: { rowIds: string[] }) => void
  unselectRows: (params: { rowIds: string[] }) => void
  toggleRowSelection: (params: { rowId: string; selected?: boolean; shiftKey?: boolean }) => void
  isRowSelected: (params: { rowId: string }) => boolean
}

export interface UseTableApiParams {
  schema: ComputedRef<TableSchemaView>
  activeLayout: Ref<TableLayout | undefined> | WritableComputedRef<TableLayout | undefined>
  pagination: WritableComputedRef<{ pageIndex: number; pageSize: number }>
  sorting: WritableComputedRef<{ key: string; dir: TableSortingDirection } | null>
  filters: WritableComputedRef<TableFilterState>
  selection: TableSelectionApi
}

export interface UseTableApi<TSchema = TableSchemaView> {
  pageSizeOptions: ComputedRef<number[]>
  sortKeys: ComputedRef<string[]>
  uiFilters: ComputedRef<TableUiFilterDefinition[]>
  getFilterDefinition: <TKey extends ExtractTableFilterKey<TSchema>>(
    key: TKey,
  ) => TableUiFilterDefinition | undefined
  getFilterOperators: <TKey extends ExtractTableFilterKey<TSchema>>(
    key: TKey,
  ) => Array<ExtractTableFilterOperator<TSchema, TKey>>
  getDefaultFilterValue: <TKey extends ExtractTableFilterKey<TSchema>>(
    key: TKey,
  ) => ExtractTableFilterValue<TSchema, TKey>
  setLayout: (layout: TableLayout) => void
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  setSorting: (sorting: TableSortingRule | null) => void
  setSortKey: (key?: string) => void
  setSortDirection: (direction: TableSortingDirection) => void
  setSearch: (search: string) => void
  clearSelection: () => void
  selectAllRows: () => void
  selectRows: (rowIds: string[]) => void
  unselectRows: (rowIds: string[]) => void
  toggleRowSelection: (options: { rowId: string; selected?: boolean; shiftKey?: boolean }) => void
  isRowSelected: (rowId: string) => boolean
  clearFilters: () => void
  resetQueryState: () => void
  getFilterState: <TKey extends ExtractTableFilterKey<TSchema>>(
    key: TKey,
  ) => ExtractTableFilterRule<TSchema, TKey> | undefined
  addFilter: <TKey extends ExtractTableFilterKey<TSchema>>(
    key: TKey,
    value: ExtractTableFilterValue<TSchema, TKey>,
    options?: { operator?: ExtractTableFilterRule<TSchema, TKey>['operator'] },
  ) => void
  updateFilter: <TKey extends ExtractTableFilterKey<TSchema>>(
    key: TKey,
    patch: Partial<ExtractTableFilterRule<TSchema, TKey>>,
  ) => void
  removeFilter: <TKey extends ExtractTableFilterKey<TSchema>>(key: TKey) => void
}

export function useTableApi<TSchema = TableSchemaView>(
  params: UseTableApiParams,
): UseTableApi<TSchema> {
  const currentLayout = computed(
    () => params.activeLayout.value ?? params.schema.value.defaultLayout ?? 'table',
  )

  const pageSizeOptions = computed(() =>
    getPageSizeOptions({
      schema: params.schema.value,
      layout: currentLayout.value,
    }),
  )

  const sortKeys = computed(() =>
    getSortKeys({
      schema: params.schema.value,
      layout: currentLayout.value,
    }),
  )

  const uiFilters = computed(() => params.schema.value.filters?.ui ?? []) as ComputedRef<
    TableUiFilterDefinition[]
  >

  function getFilterDefinition<TKey extends ExtractTableFilterKey<TSchema>>(key: TKey) {
    return uiFilters.value.find((filter) => filter.key === key) as
      | TableUiFilterDefinition
      | undefined
  }

  function getFilterOperators<TKey extends ExtractTableFilterKey<TSchema>>(key: TKey) {
    const definition = getFilterDefinition(key)

    if (!definition) {
      return [] as Array<ExtractTableFilterOperator<TSchema, TKey>>
    }

    return resolveFilterSupportedOperators(normalizeFilterDefinition(definition)) as Array<
      ExtractTableFilterOperator<TSchema, TKey>
    >
  }

  function getDefaultFilterValue<TKey extends ExtractTableFilterKey<TSchema>>(key: TKey) {
    const definition = getFilterDefinition(key)

    if (!definition) {
      return '' as ExtractTableFilterValue<TSchema, TKey>
    }

    if (definition.defaultValue != null) {
      return definition.defaultValue as ExtractTableFilterValue<TSchema, TKey>
    }

    if (definition.kind === 'option') {
      return [] as unknown as ExtractTableFilterValue<TSchema, TKey>
    }

    if (definition.kind === 'boolean') {
      return true as ExtractTableFilterValue<TSchema, TKey>
    }

    if (definition.kind === 'number') {
      return 0 as ExtractTableFilterValue<TSchema, TKey>
    }

    if (definition.kind === 'date') {
      return new Date() as ExtractTableFilterValue<TSchema, TKey>
    }

    return '' as ExtractTableFilterValue<TSchema, TKey>
  }

  function setLayout(layout: TableLayout) {
    params.activeLayout.value = layout
  }

  function setPage(page: number) {
    params.pagination.value = {
      ...params.pagination.value,
      pageIndex: Math.max(1, page || 1),
    }
  }

  function setPageSize(pageSize: number) {
    params.pagination.value = {
      pageIndex: 1,
      pageSize,
    }
  }

  function setSorting(sorting: TableSortingRule | null) {
    params.pagination.value = {
      ...params.pagination.value,
      pageIndex: 1,
    }
    params.sorting.value = sorting ? { key: sorting.key, dir: sorting.dir } : null
  }

  function setSortKey(key?: string) {
    if (!key) {
      params.sorting.value = null
      return
    }

    params.sorting.value = {
      key,
      dir: params.sorting.value?.dir ?? 'asc',
    }
  }

  function setSortDirection(direction: TableSortingDirection) {
    if (!params.sorting.value?.key) {
      return
    }

    params.sorting.value = {
      key: params.sorting.value.key,
      dir: direction,
    }
  }

  function setSearch(search: string) {
    params.pagination.value = {
      ...params.pagination.value,
      pageIndex: 1,
    }
    params.filters.value = {
      ...params.filters.value,
      search,
    }
  }

  function clearSelection() {
    params.selection.clearSelection()
  }

  function selectAllRows() {
    params.selection.selectAllRows()
  }

  function selectRows(rowIds: string[]) {
    params.selection.selectRows({ rowIds })
  }

  function unselectRows(rowIds: string[]) {
    params.selection.unselectRows({ rowIds })
  }

  function toggleRowSelection(options: { rowId: string; selected?: boolean; shiftKey?: boolean }) {
    params.selection.toggleRowSelection(options)
  }

  function isRowSelected(rowId: string) {
    return params.selection.isRowSelected({ rowId })
  }

  function getFilterState<TKey extends ExtractTableFilterKey<TSchema>>(
    key: TKey,
  ): ExtractTableFilterRule<TSchema, TKey> | undefined {
    return params.filters.value.ui.find((filter) => filter.key === key) as
      | ExtractTableFilterRule<TSchema, TKey>
      | undefined
  }

  function addFilter<TKey extends ExtractTableFilterKey<TSchema>>(
    key: TKey,
    value: ExtractTableFilterValue<TSchema, TKey>,
    options?: { operator?: ExtractTableFilterRule<TSchema, TKey>['operator'] },
  ) {
    const definition = getFilterDefinition(key)
    const operator =
      options?.operator ??
      (definition
        ? (resolveFilterDefaultOperator(
            normalizeFilterDefinition(definition),
          ) as ExtractTableFilterRule<TSchema, TKey>['operator'])
        : undefined)

    const nextRule = {
      key,
      ...(operator ? { operator } : {}),
      value,
    } as ExtractTableFilterRule<TSchema, TKey>

    const nextFilters = params.filters.value.ui.filter((filter) => filter.key !== key)

    params.pagination.value = {
      ...params.pagination.value,
      pageIndex: 1,
    }
    params.filters.value = {
      ...params.filters.value,
      ui: [...nextFilters, nextRule],
    }
  }

  function updateFilter<TKey extends ExtractTableFilterKey<TSchema>>(
    key: TKey,
    patch: Partial<ExtractTableFilterRule<TSchema, TKey>>,
  ) {
    const currentFilter = getFilterState(key)

    if (!currentFilter) {
      return
    }

    addFilter(key, (patch.value ?? currentFilter.value) as ExtractTableFilterValue<TSchema, TKey>, {
      operator: (patch.operator ?? currentFilter.operator) as
        | ExtractTableFilterRule<TSchema, TKey>['operator']
        | undefined,
    })
  }

  function removeFilter<TKey extends ExtractTableFilterKey<TSchema>>(key: TKey) {
    params.pagination.value = {
      ...params.pagination.value,
      pageIndex: 1,
    }
    params.filters.value = {
      ...params.filters.value,
      ui: params.filters.value.ui.filter((filter) => filter.key !== key),
    }
  }

  function clearFilters() {
    params.pagination.value = {
      ...params.pagination.value,
      pageIndex: 1,
    }
    params.filters.value = {
      ...params.filters.value,
      ui: [],
    }
  }

  function resetQueryState() {
    const defaultLayout = params.schema.value.defaultLayout
    const layout = defaultLayout ?? 'table'
    const defaultSort = getDefaultSort({ schema: params.schema.value, layout })

    params.activeLayout.value = defaultLayout
    params.pagination.value = {
      pageIndex: 1,
      pageSize: getDefaultPageSize({
        schema: params.schema.value,
        layout,
      }),
    }
    params.sorting.value = defaultSort
      ? {
          key: defaultSort.key,
          dir: defaultSort.dir,
        }
      : null
    params.filters.value = {
      search: '',
      ui: [],
    }
  }

  return {
    pageSizeOptions,
    sortKeys,
    uiFilters,
    getFilterDefinition,
    getFilterOperators,
    getDefaultFilterValue,
    setLayout,
    setPage,
    setPageSize,
    setSorting,
    setSortKey,
    setSortDirection,
    setSearch,
    clearSelection,
    selectAllRows,
    selectRows,
    unselectRows,
    toggleRowSelection,
    isRowSelected,
    clearFilters,
    resetQueryState,
    getFilterState,
    addFilter,
    updateFilter,
    removeFilter,
  }
}
