import { useQuery } from '@tanstack/vue-query'
import { computed, unref, type ComputedRef, type Ref } from 'vue'

import { QUERY_DEFAULTS } from '../constants/query-state'
import type {
  TableBooleanFilterDefinition,
  TableFacetExecutionResult,
  TableFacetOptionResult,
  TableFilterFacetConfig,
  TableFilterFacetSpec,
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

export interface UseTableFilterOptionsParams {
  definition: TableOptionFilterDefinition | TableBooleanFilterDefinition
  searchQuery: Ref<string>
  active?: Ref<boolean>
  ready?: Ref<boolean>
  filters: ReturnType<typeof useTableFilters>
  queryContent: Pick<UseTableDataReturn, 'facets' | 'facetsBaseContext'>
  schema: ComputedRef<TableSchemaView>
}

export function useTableFilterOptions(options: UseTableFilterOptionsParams) {
  const isActive = computed(() => options.active?.value ?? true)
  const isReady = computed(() => options.ready?.value ?? true)
  const remoteSource = computed(() =>
    options.schema.value.source.mode === 'remote' ? options.schema.value.source : null,
  )
  const normalizedSearch = computed(() => options.searchQuery.value.trim())
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
  const shouldDeriveCounts = computed(() => {
    if (options.definition.kind === 'boolean') return true
    if (options.definition.kind !== 'option') return false
    return optionUi.value?.row.showCounts ?? true
  })
  const shouldResolveCounts = computed(() => shouldDeriveCounts.value && isActive.value && isReady.value)
  const isRemoteTable = computed(() => options.schema.value.source.mode === 'remote')
  const hasRemoteOptionQuery = computed(
    () =>
      options.definition.kind === 'option' &&
      typeof options.definition.source?.query === 'function',
  )
  const facetSpec = computed(() => options.definition.source?.facet)
  const facetConfig = computed<TableFilterFacetConfig | null>(() => {
    if (!facetSpec.value || typeof facetSpec.value !== 'object') return null
    return facetSpec.value
  })
  const hasPerFilterFacetQuery = computed(
    () => typeof facetConfig.value?.query === 'function',
  )
  const usesFacetCounts = computed(
    () =>
      Boolean(facetSpec.value) &&
      (
        options.schema.value.source.mode === 'client'
        || hasPerFilterFacetQuery.value
        || (isRemoteTable.value && Boolean(remoteSource.value?.facets))
      ),
  )
  const resolvedTreeSearchMode = computed(() => {
    if (optionUi.value?.presentation !== 'tree')
      return hasRemoteOptionQuery.value ? 'remote' : 'local'

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
    return [...(options.definition.source?.options ?? [])]
  })
  const selectedValues = computed(() =>
    getSelectedValues({
      filters: options.filters,
      key: options.definition.key,
    }),
  )

  const optionQuery = useQuery<TableFilterOptionEntry[] | TableFilterOptionQueryResult>(
    computed(() => {
      const activeDefinition = optionDefinition.value

      if (
        !hasRemoteOptionQuery.value ||
        !activeDefinition ||
        typeof activeDefinition.source?.query !== 'function'
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
        activeDefinition.source.query({
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

  const perFilterFacetQuery = useQuery<TableFacetExecutionResult>(
    computed(() => {
      if (
        !isRemoteTable.value ||
        !usesFacetCounts.value ||
        !facetConfig.value?.query
      ) {
        return {
          queryKey: ['table-filter-facets', options.definition.key, 'disabled'],
          queryFn: async () => ({ facets: [] }) as TableFacetExecutionResult,
          enabled: false,
        } satisfies TableQueryDefinition<TableFacetExecutionResult> & {
          enabled: boolean
        }
      }

      const queryOptions = unref(
        facetConfig.value.query({
          table: options.queryContent.facetsBaseContext.value,
          facets: [
            {
              key: options.definition.key,
              mode: resolveFacetMode(facetConfig.value),
              search: facetSearch.value,
              limit: facetConfig.value.limit,
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
          enabled: shouldResolveCounts.value,
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

    const facets = isRemoteTable.value && hasPerFilterFacetQuery.value
      ? (unref(perFilterFacetQuery.data)?.facets ?? [])
      : options.queryContent.facets.value.facets

    return facets.find((facet: { key: string }) => facet.key === options.definition.key)?.options ?? []
  })

  const resolvedFacetCounts = computed(() =>
    facetCounts.value.flatMap((entry) =>
      isPrimitiveFilterOptionValue(entry.value)
        ? [{ value: entry.value, count: entry.count }]
        : [],
    ),
  )
  const resolvedSourceTreeEntries = computed<TableResolvedFilterOptionEntry[]>(() =>
    resolveFilterOptionEntries({
      definition: options.definition,
      rows: [],
      options: hasRemoteOptionQuery.value ? remoteEntries.value : staticEntries.value,
      facetCounts: shouldResolveCounts.value ? resolvedFacetCounts.value : [],
      selectedValues: selectedValues.value,
      deriveCounts: false,
      missingCountFallback: shouldResolveCounts.value ? 0 : undefined,
    }),
  )
  const sourceEntries = computed(() => flattenFilterOptionEntries(resolvedSourceTreeEntries.value))
  const selectableSourceEntries = computed(() =>
    sourceEntries.value.filter(
      (entry): entry is TableResolvedFilterOptionEntry & { value: string | number | boolean } =>
        entry.value != null,
    ),
  )

  const filteredTreeState = computed(() => {
    if (optionUi.value?.presentation !== 'tree') {
      return {
        entries: resolvedSourceTreeEntries.value,
        expandedIds: [] as string[],
      }
    }

    if (!normalizedSearch.value.length) {
      return {
        entries: resolvedSourceTreeEntries.value,
        expandedIds: optionUi.value.tree.expandedByDefault
          ? collectFilterOptionBranchIds(resolvedSourceTreeEntries.value)
          : [],
      }
    }

    if (resolvedTreeSearchMode.value === 'local') {
      return filterFilterOptionTree({
        entries: resolvedSourceTreeEntries.value,
        search: normalizedSearch.value,
      })
    }

    return {
      entries: resolvedSourceTreeEntries.value,
      expandedIds: collectFilterOptionBranchIds(resolvedSourceTreeEntries.value),
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
    () => optionQuery.isLoading.value && !optionQuery.isPlaceholderData.value,
  )
  const isStaleLoading = computed(
    () => !isInitialLoading.value && optionQuery.isFetching.value,
  )
  const isCountLoading = computed(
    () => isRemoteTable.value && shouldResolveCounts.value && perFilterFacetQuery.isFetching.value,
  )

  return {
    sourceEntries: selectableSourceEntries,
    sourceTreeEntries: resolvedSourceTreeEntries,
    filteredEntries,
    filteredTreeEntries: computed(() => filteredTreeState.value.entries),
    searchExpandedIds: computed(() => filteredTreeState.value.expandedIds),
    facetCounts,
    isLoading: isInitialLoading,
    isCountLoading,
    isStaleLoading,
    isError: computed(() => optionQuery.isError.value || perFilterFacetQuery.isError.value),
    error: computed(() => optionQuery.error.value ?? perFilterFacetQuery.error.value),
    refresh: () => Promise.all([optionQuery.refetch(), perFilterFacetQuery.refetch()]),
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

function resolveFacetMode(facet: TableFilterFacetSpec | undefined) {
  if (!facet) return undefined
  if (facet === 'include-self') return 'include-self'
  if (typeof facet === 'object') return facet.mode ?? 'exclude-self'
  return 'exclude-self'
}
