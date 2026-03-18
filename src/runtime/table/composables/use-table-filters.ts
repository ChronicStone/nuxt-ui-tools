import { computed, type ComputedRef } from 'vue'

import type {
  TableFilterOperator,
  TableQueryStateFilterRule,
  TableQueryStateFilterValue,
  TableSchemaView,
  TableUiFilterDefinition,
} from '../types'
import {
  buildFilterPreview,
  getFilterLabelText,
  getFilterOperatorLabel,
  resolveFilterOptionEntries,
} from '../utils'
import type { useQueryState } from './use-query-state'
import type { UseTableApi } from './use-table-api'
import type { UseTableDataReturn } from './use-table-data'
import { useTableSearch } from './use-table-search'

export interface UseTableFiltersParams {
  schema: ComputedRef<TableSchemaView>
  queryState: ReturnType<typeof useQueryState>
  api: UseTableApi
  queryContent: UseTableDataReturn
}

export function useTableFilters(params: UseTableFiltersParams) {
  const api = params.api

  const search = useTableSearch({
    schema: params.schema,
    queryState: params.queryState,
    api: params.api,
  })

  const definitions = computed<TableUiFilterDefinition[]>(
    () => params.schema.value.filters?.ui ?? [],
  )
  const activeUiFilters = computed<TableQueryStateFilterRule[]>(
    () => params.queryState.filters.value.ui ?? [],
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
    entries?: Array<{ label: string; value: string | number | boolean }>
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

    return resolveFilterOptionEntries({
      definition,
      rows: rows.value,
      options: input.entries,
      facetCounts: input.facetCounts,
      selectedValues,
      deriveCounts: params.schema.value.source.mode !== 'remote',
    })
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

    return definition ? api.getFilterOperators(input.key)[0] : undefined
  }

  function getFilterOperatorOptions(input: { key: string }) {
    return api.getFilterOperators(input.key).map((operator: string) => ({
      value: operator,
      label: getFilterOperatorLabel({
        operator: operator as TableFilterOperator,
      }),
    }))
  }

  function setFilterOperator(input: { key: string; operator: string }) {
    const currentRule = getFilterState({ key: input.key })

    if (currentRule) {
      api.updateFilter(input.key, {
        operator: input.operator as TableFilterOperator,
      })
      return
    }

    api.addFilter(
      input.key,
      getDefaultFilterValueForOperator({
        key: input.key,
        operator: input.operator as TableFilterOperator,
      }),
      {
        operator: input.operator as TableFilterOperator,
      },
    )
  }

  function getDefaultFilterValueForOperator(input: { key: string; operator: TableFilterOperator }) {
    const definition = getDefinition({ key: input.key })

    if (!definition) {
      return api.getDefaultFilterValue(input.key)
    }

    if (input.operator === 'between') {
      if (definition.kind === 'number' || definition.kind === 'date') {
        return { from: undefined, to: undefined }
      }
    }

    return api.getDefaultFilterValue(input.key)
  }

  function setOptionFilterValues(input: {
    key: string
    values: Array<string | number | boolean>
    operator?: string
  }) {
    const currentRule = getFilterState({ key: input.key })

    if (!input.values.length) {
      apiRemoveFilter({ key: input.key })
      return
    }

    api.addFilter(input.key, input.values, {
      operator: (input.operator ?? currentRule?.operator) as TableFilterOperator | undefined,
    })
  }

  function toggleOptionFilterValue(input: {
    key: string
    value: string | number | boolean
    operator?: string
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
    operator?: string
  }) {
    const currentRule = getFilterState({ key: input.key })

    if (input.value == null || input.value === '') {
      apiRemoveFilter({ key: input.key })
      return
    }

    api.addFilter(input.key, input.value as never, {
      operator: (input.operator ?? currentRule?.operator) as TableFilterOperator | undefined,
    })
  }

  function apiRemoveFilter(input: { key: string }) {
    api.removeFilter(input.key)
  }

  function clearAllFilters() {
    params.api.clearFilters()
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
