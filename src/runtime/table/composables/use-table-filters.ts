import { computed, type ComputedRef } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { isBoolean, isNumber, isString } from '../../shared/utils/predicate'
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
  mergeTableFilterDefaultRules,
  resolveTableActiveFilterRules,
  resolveTableFilterDefaultRules,
  resolveFilterOptionEntries,
} from '../utils'
import type { UseTableDataReturn } from './use-table-data'
import { useTableSearch } from './use-table-search'
import type { useTableState } from './use-table-state'

export interface UseTableFiltersParams {
  schema: ComputedRef<TableSchemaView>
  state: ReturnType<typeof useTableState>
  queryContent: Pick<UseTableDataReturn, 'rawData' | 'data'>
}

export function useTableFilters(params: UseTableFiltersParams) {
  const { t } = useUiToolsLocale()
  const search = useTableSearch({
    schema: params.schema,
    queryState: params.state.queryState,
  })

  const definitions = computed<TableUiFilterDefinition[]>(
    () => params.schema.value.filters?.ui ?? [],
  )
  const effectiveUiFilters = computed<TableQueryStateFilterRule[]>(
    () => params.state.queryState.filters.value.ui ?? [],
  )
  const defaultUiFilters = computed<TableQueryStateFilterRule[]>(() =>
    resolveTableFilterDefaultRules(definitions.value),
  )
  const activeUiFilters = computed<TableQueryStateFilterRule[]>(() =>
    resolveTableActiveFilterRules({
      rules: effectiveUiFilters.value,
      definitions: definitions.value,
    }),
  )
  const hasActiveUiFilters = computed(() => activeUiFilters.value.length > 0)

  function getDefinition(input: { key: string }) {
    return definitions.value.find(
      (definition: TableUiFilterDefinition) => definition.key === input.key,
    )
  }

  function getFilterState(input: { key: string }) {
    return effectiveUiFilters.value.find(
      (rule: TableQueryStateFilterRule) => rule.key === input.key,
    )
  }

  function getActiveFilterState(input: { key: string }) {
    return activeUiFilters.value.find((rule: TableQueryStateFilterRule) => rule.key === input.key)
  }

  function getDefaultFilterState(input: { key: string }) {
    return defaultUiFilters.value.find((rule: TableQueryStateFilterRule) => rule.key === input.key)
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

    return flattenFilterOptionEntries(
      resolveFilterOptionEntries({
        definition,
        rows: [],
        options: input.entries,
        facetCounts: input.facetCounts,
        selectedValues,
        deriveCounts: false,
      }),
    ).filter(
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

    const preview = buildFilterPreview({
      definition,
      rule: getFilterState({ key: input.key }),
      optionEntries: input.entries,
    })

    return {
      ...preview,
      active: getActiveFilterState({ key: input.key }) != null,
    }
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
      label: t(`table.filters.operators.${operator}`),
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
          <TValue>(value: TValue): value is TValue & (string | number | boolean) =>
            isString(value) || isNumber(value) || isBoolean(value),
        )
      : currentRule?.value != null
        ? isString(currentRule.value) || isNumber(currentRule.value) || isBoolean(currentRule.value)
          ? [currentRule.value]
          : []
        : []

    const nextValues = currentValues.some((value) => String(value) === String(input.value))
      ? currentValues.filter((value) => String(value) !== String(input.value))
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
    const nextRule: TableQueryStateFilterRule = { key, value }
    if (options?.operator) nextRule.operator = options.operator

    params.state.queryState.resetPagination()
    params.state.queryState.filters.value = {
      ...params.state.queryState.filters.value,
      ui: [
        ...params.state.queryState.filters.value.ui.filter((filter) => filter.key !== key),
        nextRule,
      ],
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
    const defaultRule = defaultUiFilters.value.find((filter) => filter.key === key)

    params.state.queryState.resetPagination()
    params.state.queryState.filters.value = {
      ...params.state.queryState.filters.value,
      ui: [
        ...params.state.queryState.filters.value.ui.filter((filter) => filter.key !== key),
        ...(defaultRule ? [defaultRule] : []),
      ],
    }
  }

  function clearAllFilters() {
    params.state.queryState.resetPagination()
    params.state.queryState.filters.value = {
      ...params.state.queryState.filters.value,
      ui: defaultUiFilters.value,
    }
  }

  function replaceFilters(input: { rules: TableQueryStateFilterRule[] }) {
    params.state.queryState.resetPagination()
    params.state.queryState.filters.value = {
      ...params.state.queryState.filters.value,
      ui: mergeTableFilterDefaultRules({
        rules: input.rules,
        definitions: definitions.value,
      }),
    }
  }

  return {
    searchQuery: search.searchQuery,
    searchPlaceholder: search.searchPlaceholder,
    hasActiveSearch: search.hasActiveSearch,
    definitions,
    effectiveUiFilters,
    activeUiFilters,
    hasActiveUiFilters,
    getDefinition,
    getFilterState,
    getActiveFilterState,
    getDefaultFilterState,
    getFilterOptionEntries,
    getFilterPreview,
    getFilterOperator,
    getFilterOperatorOptions,
    getDefaultFilterValueForOperator,
    setFilterOperator,
    setOptionFilterValues,
    toggleOptionFilterValue,
    setScalarFilterValue,
    clearFilter: apiRemoveFilter,
    clearAllFilters,
    replaceFilters,
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
    definition.behavior?.defaultOperator ??
    (definition.kind === 'text' ? 'contains' : definition.kind === 'option' ? 'isAnyOf' : 'is')

  return [...new Set([defaultOperator, ...(definition.behavior?.operators ?? [])])]
}
