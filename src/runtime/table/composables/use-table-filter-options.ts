import { useQuery } from '@tanstack/vue-query'
import { computed, toValue, unref, type ComputedRef, type MaybeRefOrGetter, type Ref } from 'vue'

import { QUERY_DEFAULTS } from '../constants/query-state'
import type {
  TableBooleanFilterDefinition,
  TableFacetExecutionResult,
  TableFacetOptionResult,
  TableFilterFacetMode,
  TableFilterOptionEntry,
  TableFilterOptionQueryResult,
  TableOptionFilterDefinition,
  TableOptionFilterOperator,
  TableQueryDefinition,
  TableResolvedFilterOptionEntry,
  TableSchemaView,
} from '../types'
import {
  collectFilterOptionBranchIds,
  filterFilterOptionTree,
  flattenFilterOptionEntries,
  resolveFilterOptionEntries,
  resolveOptionFilterUi,
} from '../utils'
import type { UseTableDataReturn } from './use-table-data'
import type { useTableFilters } from './use-table-filters'

function resolveFacetMode(options: { facet: TableFilterFacetMode | undefined }) {
  if (!options.facet) return undefined
  if (options.facet === true) return 'exclude-self'
  return options.facet
}

export interface UseTableFilterOptionsParams {
  definition: TableOptionFilterDefinition | TableBooleanFilterDefinition
  searchQuery: Ref<string>
  active?: MaybeRefOrGetter<boolean>
  filters: ReturnType<typeof useTableFilters>
  queryContent: UseTableDataReturn
  schema: ComputedRef<TableSchemaView>
}

export function useTableFilterOptions(options: UseTableFilterOptionsParams) {
  const remoteSource = computed(() =>
    options.schema.value.source.mode === 'remote' ? options.schema.value.source : null,
  )
  const normalizedSearch = computed(() => options.searchQuery.value.trim())
  const selectedValues = computed(() =>
    getSelectedValues({
      filters: options.filters,
      key: options.definition.key,
    }),
  )
  const shouldHydrate = computed(
    () => Boolean(toValue(options.active)) || selectedValues.value.length > 0,
  )
  const isBooleanFilter = computed(() => options.definition.kind === 'boolean')
  const optionDefinition = computed(() =>
    options.definition.kind === 'option' ? options.definition : undefined,
  )
  const optionOperator = computed<TableOptionFilterOperator | undefined>(() => {
    if (options.definition.kind !== 'option') return undefined

    const current = options.filters.getFilterOperator({
      key: options.definition.key,
    })

    return current === 'isAnyOf' || current === 'isNot' ? current : 'is'
  })
  const optionUi = computed(() =>
    optionDefinition.value ? resolveOptionFilterUi(optionDefinition.value, optionOperator.value) : undefined,
  )
  const isRemoteTable = computed(() => options.schema.value.source.mode === 'remote')
  const hasRemoteOptionQuery = computed(
    () => options.definition.kind === 'option' && typeof options.definition.query === 'function',
  )
  const usesFacetCounts = computed(
    () =>
      isRemoteTable.value &&
      Boolean(options.definition.facet) &&
      typeof remoteSource.value?.facets === 'function',
  )
  const canMergeFacetCounts = computed(() => !isRemoteTable.value || usesFacetCounts.value)
  const resolvedTreeSearchMode = computed(() => {
    if (optionUi.value?.presentation !== 'tree') {
      return hasRemoteOptionQuery.value ? 'remote' : 'local'
    }

    const configured = optionUi.value.tree.searchMode

    if (configured === 'local' || configured === 'remote') return configured
    return hasRemoteOptionQuery.value ? 'remote' : 'local'
  })
  const querySearch = computed(() => {
    if (!hasRemoteOptionQuery.value) return undefined
    if (resolvedTreeSearchMode.value === 'local') return undefined
    return normalizedSearch.value || undefined
  })
  const facetSearch = computed(() =>
    resolvedTreeSearchMode.value === 'remote' ? normalizedSearch.value || undefined : undefined,
  )

  const staticEntries = computed<TableFilterOptionEntry[]>(() => {
    if (options.definition.kind !== 'option') return []
    return [...(options.definition.options ?? [])]
  })

  const optionQuery = useQuery<TableFilterOptionEntry[] | TableFilterOptionQueryResult>(
    computed(() => {
      const activeDefinition = optionDefinition.value

      if (
        !shouldHydrate.value ||
        !hasRemoteOptionQuery.value ||
        !activeDefinition ||
        typeof activeDefinition.query !== 'function'
      ) {
        return {
          queryKey: ['table-filter-options', options.definition.key, 'disabled'],
          queryFn: async () => ({ options: [] }) as TableFilterOptionQueryResult,
          enabled: false,
        } satisfies TableQueryDefinition<
          TableFilterOptionEntry[] | TableFilterOptionQueryResult
        > & {
          enabled: boolean
        }
      }

      const queryOptions = unref(
        activeDefinition.query({
          search: querySearch.value,
          limit: undefined,
          cursor: undefined,
        }),
      )

      return Object.assign(
        {
          ...queryOptions,
          queryKey: queryOptions.queryKey,
          queryFn: queryOptions.queryFn,
          placeholderData: (
            previousData: TableFilterOptionEntry[] | TableFilterOptionQueryResult | undefined,
          ) => previousData,
        },
        {
          staleTime: QUERY_DEFAULTS.staleTime.filterOptions,
          refetchOnWindowFocus: QUERY_DEFAULTS.refetchOnWindowFocus,
        },
      )
    }),
  )

  const facetQuery = useQuery<TableFacetExecutionResult>(
    computed(() => {
      if (!shouldHydrate.value || !usesFacetCounts.value) {
        return {
          queryKey: ['table-filter-facets', options.definition.key, 'disabled'],
          queryFn: async () => ({ facets: [] }) as TableFacetExecutionResult,
          enabled: false,
        } satisfies TableQueryDefinition<TableFacetExecutionResult> & {
          enabled: boolean
        }
      }

      const queryOptions = unref(
        remoteSource.value!.facets!({
          table: options.queryContent.requestContext.value as never,
          facets: [
            {
              key: options.definition.key,
              mode: resolveFacetMode({
                facet: options.definition.facet,
              }),
              search: facetSearch.value,
              limit: undefined,
              cursor: undefined,
            },
          ],
        }),
      )

      return Object.assign(
        {
          ...queryOptions,
          queryKey: queryOptions.queryKey,
          queryFn: queryOptions.queryFn,
          placeholderData: (previousData: TableFacetExecutionResult | undefined) => previousData,
        },
        {
          staleTime: QUERY_DEFAULTS.staleTime.filterOptions,
          refetchOnWindowFocus: QUERY_DEFAULTS.refetchOnWindowFocus,
        },
      )
    }),
  )

  const remoteEntries = computed<TableFilterOptionEntry[]>(() => {
    if (!hasRemoteOptionQuery.value) return []

    const result = unref(optionQuery.data)
    if (Array.isArray(result)) return [...result]
    return result?.options ? [...result.options] : []
  })

  const facetCounts = computed<TableFacetOptionResult[]>(() => {
    if (!usesFacetCounts.value) return []

    const facets = unref(facetQuery.data)?.facets ?? []
    return facets.find((facet: { key: string }) => facet.key === options.definition.key)?.options ?? []
  })

  const sourceTreeEntries = computed<TableResolvedFilterOptionEntry[]>(() => {
    const entries = hasRemoteOptionQuery.value ? remoteEntries.value : staticEntries.value
    const rows = shouldHydrate.value
      ? options.schema.value.source.mode === 'client'
        ? (options.queryContent.rawData.value.rows ?? [])
        : (options.queryContent.data.value.rows ?? [])
      : []

    return resolveFilterOptionEntries({
      definition: options.definition,
      rows,
      options: entries,
      facetCounts: (shouldHydrate.value ? facetCounts.value : []).flatMap((entry) =>
        isPrimitiveFilterOptionValue(entry.value)
          ? [{
              value: entry.value,
              count: entry.count,
            }]
          : [],
      ),
      selectedValues: selectedValues.value,
      deriveCounts: shouldHydrate.value && canMergeFacetCounts.value,
    })
  })

  const sourceEntries = computed(() => flattenFilterOptionEntries(sourceTreeEntries.value))
  const selectableSourceEntries = computed(() =>
    sourceEntries.value.filter(
      (entry): entry is TableResolvedFilterOptionEntry & { value: string | number | boolean } =>
        entry.value != null,
    ),
  )

  const filteredTreeState = computed(() => {
    if (optionUi.value?.presentation !== 'tree') {
      return {
        entries: sourceTreeEntries.value,
        expandedIds: [] as string[],
      }
    }

    if (!normalizedSearch.value.length) {
      return {
        entries: sourceTreeEntries.value,
        expandedIds: optionUi.value.tree.expandedByDefault
          ? collectFilterOptionBranchIds(sourceTreeEntries.value)
          : [],
      }
    }

    if (resolvedTreeSearchMode.value === 'local') {
      return filterFilterOptionTree({
        entries: sourceTreeEntries.value,
        search: normalizedSearch.value,
      })
    }

    return {
      entries: sourceTreeEntries.value,
      expandedIds: collectFilterOptionBranchIds(sourceTreeEntries.value),
    }
  })

  const filteredEntries = computed(() => {
    if (optionUi.value?.presentation === 'tree') {
      return flattenFilterOptionEntries(filteredTreeState.value.entries).filter(
        (entry): entry is TableResolvedFilterOptionEntry & { value: string | number | boolean } =>
          entry.value != null,
      )
    }

    if (!normalizedSearch.value.length || hasRemoteOptionQuery.value) return selectableSourceEntries.value

    return selectableSourceEntries.value.filter((entry) =>
      entry.label.toLowerCase().includes(normalizedSearch.value.toLowerCase()),
    )
  })

  const isInitialLoading = computed(
    () =>
      (optionQuery.isLoading.value && !optionQuery.isPlaceholderData.value) ||
      (facetQuery.isLoading.value && !facetQuery.isPlaceholderData.value),
  )
  const isStaleLoading = computed(
    () => !isInitialLoading.value && (optionQuery.isFetching.value || facetQuery.isFetching.value),
  )

  return {
    sourceEntries: selectableSourceEntries,
    sourceTreeEntries,
    filteredEntries,
    filteredTreeEntries: computed(() => filteredTreeState.value.entries),
    searchExpandedIds: computed(() => filteredTreeState.value.expandedIds),
    facetCounts,
    isLoading: isInitialLoading,
    isStaleLoading,
    isError: computed(() => optionQuery.isError.value || facetQuery.isError.value),
    error: computed(() => optionQuery.error.value ?? facetQuery.error.value),
    refresh: () => Promise.all([optionQuery.refetch(), facetQuery.refetch()]),
  }
}

function getSelectedValues(options: {
  filters: ReturnType<typeof useTableFilters>
  key: string
}) {
  const rule = options.filters.getFilterState({ key: options.key })

  if (Array.isArray(rule?.value)) return rule.value
  if (rule?.value != null) return [rule.value]
  return []
}

function isPrimitiveFilterOptionValue(
  value: unknown,
): value is string | number | boolean {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
}
