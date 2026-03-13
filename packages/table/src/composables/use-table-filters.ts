import { Debouncer } from '@tanstack/pacer'
import { computed, onBeforeUnmount, ref, watch } from 'vue'

import type {
  TableFilterOperator,
  TableQueryStateFilterRule,
  TableUiFilterDefinition,
} from '../types'
import {
  buildFilterPreview,
  getFilterLabelText,
  getFilterOperatorLabel,
  resolveFilterOptionEntries,
} from '../utils'

export function useTableFilters(options: {
  schema: any
  queryState: any
  api: any
  queryContent: any
}) {
  const api = options.api
  const searchQuery = ref(String(options.queryState.filters.value.search ?? ''))
  const definitions = computed<TableUiFilterDefinition[]>(() => options.schema.value.filters?.ui ?? [])
  const activeUiFilters = computed<TableQueryStateFilterRule[]>(() => options.queryState.filters.value.ui ?? [])
  const hasActiveUiFilters = computed(() => activeUiFilters.value.length > 0)
  const hasActiveSearch = computed(() => searchQuery.value.trim().length > 0)
  const rows = computed(() =>
    options.schema.value.source.mode === 'client'
      ? (options.queryContent.rawData.value.rows ?? [])
      : (options.queryContent.data.value.rows ?? []),
  )
  const searchPlaceholder = computed(
    () => options.schema.value.filters?.search?.placeholder ?? 'Search rows…',
  )
  const searchDebounce = computed(
    () => Math.max(0, options.schema.value.filters?.search?.debounce ?? 260),
  )

  const searchDebouncer = new Debouncer(
    (value: string) => {
      options.api.setSearch(value)
    },
    {
      wait: searchDebounce.value,
    },
  )

  watch(
    () => options.queryState.filters.value.search,
    (value) => {
      const normalizedValue = String(value ?? '')

      if (normalizedValue !== searchQuery.value) {
        searchQuery.value = normalizedValue
      }
    },
  )

  watch(searchDebounce, (wait) => {
    searchDebouncer.setOptions({ wait })
  })

  watch(searchQuery, (value) => {
    searchDebouncer.maybeExecute(value)
  })

  function getDefinition(options: {
    key: string
  }) {
    return definitions.value.find((definition: TableUiFilterDefinition) => definition.key === options.key)
  }

  function getFilterState(options: {
    key: string
  }) {
    return activeUiFilters.value.find((rule: TableQueryStateFilterRule) => rule.key === options.key)
  }

  function getFilterOptionEntries(params: {
    key: string
    entries?: Array<{ label: string; value: string | number | boolean }>
    facetCounts?: Array<{ value: string | number | boolean; count: number }>
  }) {
    const definition = getDefinition({
      key: params.key,
    })

    if (!definition) {
      return []
    }

    const rule = getFilterState({
      key: params.key,
    })
    const selectedValues = Array.isArray(rule?.value)
      ? rule.value
      : rule?.value != null
        ? [rule.value]
        : []

    return resolveFilterOptionEntries({
      definition,
      rows: rows.value,
      options: params.entries,
      facetCounts: params.facetCounts,
      selectedValues,
      deriveCounts: options.schema.value.source.mode !== 'remote',
    })
  }

  function getFilterPreview(options: {
    key: string
    entries?: Array<{ label: string; value: string | number | boolean }>
  }) {
    const definition = getDefinition({
      key: options.key,
    })

    if (!definition) {
      return buildFilterPreview({
        definition: {
          kind: 'text',
          key: options.key,
          label: options.key,
        },
      })
    }

    return buildFilterPreview({
      definition,
      rule: getFilterState({
        key: options.key,
      }),
      optionEntries: options.entries,
    })
  }

  function getFilterOperator(options: {
    key: string
  }) {
    const definition = getDefinition({
      key: options.key,
    })
    const rule = getFilterState({
      key: options.key,
    })

    if (rule?.operator) {
      return rule.operator
    }

    return definition
      ? api.getFilterOperators(options.key)[0]
      : undefined
  }

  function getFilterOperatorOptions(options: {
    key: string
  }) {
    return api.getFilterOperators(options.key).map((operator: string) => ({
      value: operator,
      label: getFilterOperatorLabel({
        operator: operator as any,
      }),
    }))
  }

  function setFilterOperator(options: {
    key: string
    operator: string
  }) {
    const currentRule = getFilterState({
      key: options.key,
    })

    if (currentRule) {
      api.updateFilter(options.key, {
        operator: options.operator as any,
      })
      return
    }

    api.addFilter(options.key, getDefaultFilterValueForOperator({
      key: options.key,
      operator: options.operator as TableFilterOperator,
    }), {
      operator: options.operator as any,
    })
  }

  function getDefaultFilterValueForOperator(options: {
    key: string
    operator: TableFilterOperator
  }) {
    const definition = getDefinition({
      key: options.key,
    })

    if (!definition) {
      return api.getDefaultFilterValue(options.key)
    }

    if (options.operator === 'between') {
      if (definition.kind === 'number') {
        return {
          from: undefined,
          to: undefined,
        }
      }

      if (definition.kind === 'date') {
        return {
          from: undefined,
          to: undefined,
        }
      }
    }

    return api.getDefaultFilterValue(options.key)
  }

  function setOptionFilterValues(options: {
    key: string
    values: Array<string | number | boolean>
  }) {
    const currentRule = getFilterState({
      key: options.key,
    })

    if (!options.values.length) {
      apiRemoveFilter({
        key: options.key,
      })
      return
    }

    api.addFilter(options.key, options.values, {
      operator: currentRule?.operator as any,
    })
  }

  function toggleOptionFilterValue(options: {
    key: string
    value: string | number | boolean
  }) {
    const currentRule = getFilterState({
      key: options.key,
    })
    const currentValues = Array.isArray(currentRule?.value)
      ? currentRule.value.filter((value: unknown): value is string | number | boolean =>
          typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean',
        )
      : currentRule?.value != null
        ? (
            typeof currentRule.value === 'string' ||
            typeof currentRule.value === 'number' ||
            typeof currentRule.value === 'boolean'
              ? [currentRule.value]
              : []
          )
        : []

    const nextValues = currentValues.some((value: unknown) => String(value) === String(options.value))
      ? currentValues.filter((value: unknown) => String(value) !== String(options.value))
      : [...currentValues, options.value]

    setOptionFilterValues({
      key: options.key,
      values: nextValues,
    })
  }

  function setScalarFilterValue(options: {
    key: string
    value:
      | string
      | number
      | boolean
      | Date
      | { from?: string | number | Date; to?: string | number | Date }
      | null
      | undefined
  }) {
    const currentRule = getFilterState({
      key: options.key,
    })

    if (options.value == null || options.value === '') {
      apiRemoveFilter({
        key: options.key,
      })
      return
    }

    api.addFilter(options.key, options.value, {
      operator: currentRule?.operator as any,
    })
  }

  function apiRemoveFilter(options: {
    key: string
  }) {
    api.removeFilter(options.key)
  }

  function clearAllFilters() {
    options.api.clearFilters()
  }

  onBeforeUnmount(() => {
    searchDebouncer.cancel()
  })

  return {
    searchQuery,
    definitions,
    activeUiFilters,
    hasActiveUiFilters,
    hasActiveSearch,
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
    searchPlaceholder,
    searchDebounce,
    searchDebouncer,
  }
}
