import { computed, type ComputedRef } from 'vue'

import type {
  TableFilterOptionEntry,
  TableFilterOperator,
  TableFilterPrimitiveValue,
  TableQueryStateFilterRule,
  TableQueryStateFilterValue,
  TableSchemaView,
  TableUiFilterDefinition,
} from '../types'
import {
  buildFilterPreview,
  createFilterValueForOperator,
  flattenFilterOptionEntries,
  getFilterLabelText,
  getFilterOperatorLabel,
  resolveFilterOptionEntries,
} from '../utils'
import type { UseTableDataReturn } from './use-table-data'
import { useTableSearch } from './use-table-search'
import type { useTableState } from './use-table-state'

export interface UseTableFiltersParams {
  schema: ComputedRef<TableSchemaView>
  state: ReturnType<typeof useTableState>
  queryContent: UseTableDataReturn
}

export function useTableFilters(params: UseTableFiltersParams) {
  const search = useTableSearch({
    schema: params.schema,
    queryState: params.state.queryState,
  })

  const definitions = computed<TableUiFilterDefinition[]>(
    () => params.schema.value.filters?.ui ?? [],
  )
  const activeUiFilters = computed<TableQueryStateFilterRule[]>(
    () => params.state.queryState.filters.value.ui ?? [],
  )
  const hasActiveUiFilters = computed(() => activeUiFilters.value.length > 0)

  const rows = computed(() =>
    params.schema.value.source.mode === 'client'
      ? (params.queryContent.rawData.value.rows ?? [])
      : (params.queryContent.data.value.rows ?? []),
  )

  function getDefinition(input: { key: string }) {
    return definitions.value.find(
      (definition: TableUiFilterDefinition) => definition.key === input.key,
    )
  }

  function getFilterState(input: { key: string }) {
    return activeUiFilters.value.find((rule: TableQueryStateFilterRule) => rule.key === input.key)
  }

  function getFilterOptionEntries(input: {
    key: string
    entries?: TableFilterOptionEntry[]
    facetCounts?: Array<{ value: string | number | boolean; count: number }>
  }) {
    const definition = getDefinition({ key: input.key })

    if (!definition) {
      return []
    }

    const rule = getFilterState({ key: input.key })
    const selectedValues = Array.isArray(rule?.value)
      ? rule.value
      : rule?.value != null
        ? [rule.value]
        : []

    return flattenFilterOptionEntries(resolveFilterOptionEntries({
      definition,
      rows: rows.value,
      options: input.entries,
      facetCounts: input.facetCounts,
      selectedValues,
      deriveCounts: params.schema.value.source.mode !== 'remote',
    })).filter(
      (entry): entry is typeof entry & { value: string | number | boolean } => entry.value != null,
    )
  }

  function getFilterPreview(input: {
    key: string
    entries?: Array<{ label: string; value: string | number | boolean }>
  }) {
    const definition = getDefinition({ key: input.key })

    if (!definition) {
      return buildFilterPreview({
        definition: {
          kind: 'text',
          key: input.key,
          label: input.key,
        },
      })
    }

    return buildFilterPreview({
      definition,
      rule: getFilterState({ key: input.key }),
      optionEntries: input.entries,
    })
  }

  function getFilterOperator(input: { key: string }) {
    const definition = getDefinition({ key: input.key })
    const rule = getFilterState({ key: input.key })

    if (rule?.operator) {
      return rule.operator
    }

    return definition ? getFilterOperators(input.key)[0] : undefined
  }

  function getFilterOperators(key: string) {
    return getFilterOperatorsForDefinition(getDefinition({ key }))
  }

  function getFilterOperatorOptions(input: { key: string }) {
    return getFilterOperators(input.key).map((operator) => ({
      value: operator,
      label: getFilterOperatorLabel({
        operator,
      }),
    }))
  }

  function setFilterOperator(input: { key: string; operator: TableFilterOperator }) {
    const currentRule = getFilterState({ key: input.key })

    if (currentRule) {
      updateFilter(input.key, {
        operator: input.operator,
      })
      return
    }

    addFilter(
      input.key,
      getDefaultFilterValueForOperator({
        key: input.key,
        operator: input.operator,
      }),
      {
        operator: input.operator,
      },
    )
  }

  function getDefaultFilterValueForOperator(input: { key: string; operator: TableFilterOperator }) {
    return createFilterValueForOperator({
      definition: getDefinition({ key: input.key }),
      operator: input.operator,
    })
  }

  function setOptionFilterValues(input: {
    key: string
    values: TableFilterPrimitiveValue[]
    operator?: TableFilterOperator
  }) {
    const currentRule = getFilterState({ key: input.key })

    if (!input.values.length) {
      apiRemoveFilter({ key: input.key })
      return
    }

    addFilter(input.key, input.values, {
      operator: resolveActiveOperator({
        inputOperator: input.operator,
        currentOperator: currentRule?.operator,
      }),
    })
  }

  function toggleOptionFilterValue(input: {
    key: string
    value: TableFilterPrimitiveValue
    operator?: TableFilterOperator
  }) {
    const currentRule = getFilterState({ key: input.key })
    const currentValues = Array.isArray(currentRule?.value)
      ? currentRule.value.filter(
          (value: unknown): value is string | number | boolean =>
            typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean',
        )
      : currentRule?.value != null
        ? typeof currentRule.value === 'string' ||
            typeof currentRule.value === 'number' ||
            typeof currentRule.value === 'boolean'
          ? [currentRule.value]
          : []
        : []

    const nextValues = currentValues.some((value: unknown) => String(value) === String(input.value))
      ? currentValues.filter((value: unknown) => String(value) !== String(input.value))
      : [...currentValues, input.value]

    setOptionFilterValues({
      key: input.key,
      values: nextValues,
      operator: input.operator,
    })
  }

  function setScalarFilterValue(input: {
    key: string
    value: TableQueryStateFilterValue | null | undefined
    operator?: TableFilterOperator
  }) {
    const currentRule = getFilterState({ key: input.key })

    if (input.value == null || input.value === '') {
      apiRemoveFilter({ key: input.key })
      return
    }

    addFilter(input.key, input.value, {
      operator: resolveActiveOperator({
        inputOperator: input.operator,
        currentOperator: currentRule?.operator,
      }),
    })
  }

  function apiRemoveFilter(input: { key: string }) {
    removeFilter(input.key)
  }

  function addFilter(
    key: string,
    value: TableQueryStateFilterValue,
    options?: { operator?: TableFilterOperator },
  ) {
    const nextRule: TableQueryStateFilterRule = {
      key,
      ...(options?.operator ? { operator: options.operator } : {}),
      value,
    }

    params.state.queryState.pagination.value = {
      ...params.state.queryState.pagination.value,
      pageIndex: 1,
    }
    params.state.queryState.filters.value = {
      ...params.state.queryState.filters.value,
      ui: [...params.state.queryState.filters.value.ui.filter((filter) => filter.key !== key), nextRule],
    }
  }

  function updateFilter(key: string, patch: Partial<TableQueryStateFilterRule>) {
    const currentRule = getFilterState({ key })

    if (!currentRule) {
      return
    }

    addFilter(key, patch.value ?? currentRule.value, {
      operator: patch.operator ?? currentRule.operator,
    })
  }

  function removeFilter(key: string) {
    params.state.queryState.pagination.value = {
      ...params.state.queryState.pagination.value,
      pageIndex: 1,
    }
    params.state.queryState.filters.value = {
      ...params.state.queryState.filters.value,
      ui: params.state.queryState.filters.value.ui.filter((filter) => filter.key !== key),
    }
  }

  function clearAllFilters() {
    params.state.queryState.pagination.value = {
      ...params.state.queryState.pagination.value,
      pageIndex: 1,
    }
    params.state.queryState.filters.value = {
      ...params.state.queryState.filters.value,
      ui: [],
    }
  }

  return {
    searchQuery: search.searchQuery,
    searchPlaceholder: search.searchPlaceholder,
    hasActiveSearch: search.hasActiveSearch,
    definitions,
    activeUiFilters,
    hasActiveUiFilters,
    getDefinition,
    getFilterState,
    getFilterOptionEntries,
    getFilterPreview,
    getFilterOperator,
    getFilterOperatorOptions,
    setFilterOperator,
    setOptionFilterValues,
    toggleOptionFilterValue,
    setScalarFilterValue,
    clearFilter: apiRemoveFilter,
    clearAllFilters,
    getFilterLabelText,
  }
}

function resolveActiveOperator(options: {
  inputOperator?: TableFilterOperator
  currentOperator?: TableFilterOperator
}) {
  return options.inputOperator ?? options.currentOperator
}

function getFilterOperatorsForDefinition(
  definition: TableUiFilterDefinition | undefined,
): TableFilterOperator[] {
  if (!definition) {
    return []
  }

  const defaultOperator =
    definition.defaultOperator ??
    (definition.kind === 'text'
      ? 'contains'
      : definition.kind === 'option'
        ? 'isAnyOf'
        : 'is')

  return [...new Set([defaultOperator, ...(definition.operators ?? [])])]
}
