import { useQuery } from '@tanstack/vue-query'
import { computed, ref, shallowRef, unref, watch, type ComputedRef, type Ref } from 'vue'

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

const FILTER_OPTION_COUNT_CACHE = new Map<string, TableResolvedFilterOptionEntry[]>()
const FILTER_OPTION_CACHE_IDS = new WeakMap<object, number>()
let filterOptionCacheId = 0

function resolveFacetMode(options: { facet: TableFilterFacetMode | undefined }) {
  if (!options.facet) return undefined
  if (options.facet === true) return 'exclude-self'
  return options.facet
}

export interface UseTableFilterOptionsParams {
  definition: TableOptionFilterDefinition | TableBooleanFilterDefinition
  searchQuery: Ref<string>
  active?: Ref<boolean>
  ready?: Ref<boolean>
  filters: ReturnType<typeof useTableFilters>
  queryContent: Pick<UseTableDataReturn, 'rawData' | 'data' | 'requestContext'>
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
  const usesFacetCounts = computed(
    () =>
      isRemoteTable.value &&
      Boolean(options.definition.source?.facet) &&
      typeof remoteSource.value?.facets === 'function',
  )
  const canMergeFacetCounts = computed(() => !isRemoteTable.value || usesFacetCounts.value)
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
  const selectedValueKey = computed(() => selectedValues.value.map(String).join('|'))
  const sourceRows = computed(() =>
    options.schema.value.source.mode === 'client'
      ? (options.queryContent.rawData.value.rows ?? [])
      : (options.queryContent.data.value.rows ?? []),
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

  const facetQuery = useQuery<TableFacetExecutionResult>(
    computed(() => {
      if (!usesFacetCounts.value) {
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
                facet: options.definition.source?.facet,
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

    const facets = unref(facetQuery.data)?.facets ?? []
    return facets.find((facet: { key: string }) => facet.key === options.definition.key)?.options ?? []
  })

  const baseSourceTreeEntries = computed<TableResolvedFilterOptionEntry[]>(() =>
    resolveFilterOptionEntries({
      definition: options.definition,
      rows: [],
      options: hasRemoteOptionQuery.value ? remoteEntries.value : staticEntries.value,
      facetCounts: [],
      selectedValues: selectedValues.value,
      deriveCounts: false,
    }),
  )

  const countTreeEntries = shallowRef<TableResolvedFilterOptionEntry[] | null>(null)
  const countStatus = ref<'idle' | 'loading' | 'ready'>('idle')
  let countJobId = 0
  const countCacheKey = computed(() =>
    [
      options.definition.key,
      selectedValueKey.value,
      canMergeFacetCounts.value ? 'merge' : 'no-merge',
      shouldDeriveCounts.value ? 'counts' : 'no-counts',
      getCacheIdentity(sourceRows.value),
      getCacheIdentity(options.definition.kind === 'option' ? options.definition.source?.options : undefined),
      getCacheIdentity(unref(optionQuery.data)),
      getCacheIdentity(unref(facetQuery.data)),
    ].join(':'),
  )

  function resolveFacetCountEntries() {
    return facetCounts.value.flatMap((entry) =>
      isPrimitiveFilterOptionValue(entry.value)
        ? [{
            value: entry.value,
            count: entry.count,
          }]
        : [],
    )
  }

  function invalidateCountCache() {
    const cached = FILTER_OPTION_COUNT_CACHE.get(countCacheKey.value) ?? null
    countTreeEntries.value = cached
    countStatus.value = cached ? 'ready' : 'idle'
  }

  function scheduleCountResolution() {
    countJobId += 1

    if (!shouldResolveCounts.value) return
    if (countTreeEntries.value) {
      countStatus.value = 'ready'
      return
    }

    const jobId = countJobId
    countStatus.value = 'loading'

    const run = () => {
      if (jobId !== countJobId) return

      countTreeEntries.value = resolveFilterOptionEntries({
        definition: options.definition,
        rows: sourceRows.value,
        options: hasRemoteOptionQuery.value ? remoteEntries.value : staticEntries.value,
        facetCounts: resolveFacetCountEntries(),
        selectedValues: selectedValues.value,
        deriveCounts: canMergeFacetCounts.value,
      })
      FILTER_OPTION_COUNT_CACHE.set(countCacheKey.value, countTreeEntries.value)
      countStatus.value = 'ready'
    }

    if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
      queueMicrotask(run)
      return
    }

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(run)
    })
  }

  watch(
    [sourceRows, staticEntries, remoteEntries, facetCounts, canMergeFacetCounts, selectedValueKey],
    invalidateCountCache,
  )

  watch(
    [shouldResolveCounts, sourceRows, staticEntries, remoteEntries, facetCounts, canMergeFacetCounts, selectedValueKey],
    scheduleCountResolution,
    { immediate: true },
  )

  const resolvedSourceTreeEntries = computed<TableResolvedFilterOptionEntry[]>(() =>
    countTreeEntries.value ?? baseSourceTreeEntries.value,
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
    () => countStatus.value === 'loading' || (shouldResolveCounts.value && facetQuery.isFetching.value),
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
    isError: computed(() => optionQuery.isError.value || facetQuery.isError.value),
    error: computed(() => optionQuery.error.value ?? facetQuery.error.value),
    refresh: () => Promise.all([optionQuery.refetch(), facetQuery.refetch()]),
  }
}

function getCacheIdentity(value: unknown) {
  if (typeof value !== 'object' || value === null) return 'null'

  const cached = FILTER_OPTION_CACHE_IDS.get(value)
  if (cached) return String(cached)

  filterOptionCacheId += 1
  FILTER_OPTION_CACHE_IDS.set(value, filterOptionCacheId)
  return String(filterOptionCacheId)
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
