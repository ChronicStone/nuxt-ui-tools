import { useQueries, useQuery } from '@tanstack/vue-query'
import type { QueryFunctionContext } from '@tanstack/vue-query'
import { computed, unref, watch } from 'vue'
import type { ComputedRef, Ref } from 'vue'

import {
  isBoolean,
  isFunction,
  isNumber,
  isObject,
  isString,
  isNullish,
} from '../../shared/utils/predicate'
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
  resolveTableFacetMode,
} from '../utils'
import type { UseTableDataReturn } from './use-table-data'
import type { useTableFilters } from './use-table-filters'
import { useTableRemoteFilterOptions } from './use-table-remote-filter-options'

/** Counts of one page of remote options, with the values that were asked for. */
interface PageFacetCounts {
  result: TableFacetExecutionResult
  values: readonly (string | number | boolean)[]
}

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
    if (options.definition.kind !== 'option') {
      return
    }

    const current = options.filters.getFilterOperator({
      key: options.definition.key,
    })

    return current === 'isAnyOf' || current === 'isNot' ? current : 'is'
  })
  const optionUi = computed(() =>
    optionDefinition.value
      ? resolveOptionFilterUi(optionDefinition.value, optionOperator.value)
      : undefined,
  )
  const shouldDeriveCounts = computed(() => {
    if (options.definition.kind === 'boolean') {
      return true
    }
    if (options.definition.kind !== 'option') {
      return false
    }
    return optionUi.value?.row.showCounts ?? true
  })
  const shouldResolveCounts = computed(
    () => shouldDeriveCounts.value && isActive.value && isReady.value,
  )
  const isRemoteTable = computed(() => options.schema.value.source.mode === 'remote')
  const remoteConfig = computed(() => optionDefinition.value?.source?.remote)
  /** Options load page by page from `source.remote`, which wins over `options` and `query`. */
  const hasRemotePages = computed(() => Boolean(remoteConfig.value))
  const hasRemoteOptionQuery = computed(
    () =>
      !hasRemotePages.value &&
      options.definition.kind === 'option' &&
      isFunction(options.definition.source?.query),
  )
  /** The server filters options by the search term. */
  const hasServerOptions = computed(() => hasRemotePages.value || hasRemoteOptionQuery.value)
  const facetSpec = computed(() => options.definition.source?.facet)
  const facetConfig = computed<TableFilterFacetConfig | null>(() =>
    isFacetConfig(facetSpec.value) ? facetSpec.value : null,
  )
  const hasPerFilterFacetQuery = computed(() => isFunction(facetConfig.value?.query))
  const usesFacetCounts = computed(
    () =>
      Boolean(facetSpec.value) &&
      (options.schema.value.source.mode === 'client' ||
        hasPerFilterFacetQuery.value ||
        // The main request cannot count options it never lists: paged options need `facet.query`.
        (isRemoteTable.value && Boolean(remoteSource.value?.facets) && !hasRemotePages.value)),
  )
  /** Paged options on a remote table count through the filter's facet query, page by page. */
  const countsPagesRemotely = computed(
    () => hasRemotePages.value && isRemoteTable.value && hasPerFilterFacetQuery.value,
  )
  const resolvedTreeSearchMode = computed(() => {
    if (optionUi.value?.presentation !== 'tree') {
      return hasServerOptions.value ? 'remote' : 'local'
    }

    const configured = optionUi.value.tree.searchMode

    if (configured === 'local' || configured === 'remote') {
      return configured
    }
    return hasServerOptions.value ? 'remote' : 'local'
  })
  const querySearch = computed(() => {
    if (!hasServerOptions.value) {
      return
    }
    if (resolvedTreeSearchMode.value === 'local') {
      return
    }
    return normalizedSearch.value || undefined
  })
  const facetSearch = computed(() =>
    resolvedTreeSearchMode.value === 'remote' ? normalizedSearch.value || undefined : undefined,
  )

  const staticEntries = computed<TableFilterOptionEntry[]>(() => {
    if (options.definition.kind !== 'option') {
      return []
    }
    return [...(options.definition.source?.options ?? [])]
  })
  const selectedValues = computed(() =>
    getSelectedValues({
      filters: options.filters,
      key: options.definition.key,
    }),
  )

  const remotePages = useTableRemoteFilterOptions({
    config: remoteConfig,
    enabled: computed(() => isActive.value && isReady.value),
    search: computed(() => querySearch.value ?? ''),
  })
  // Options of picked values stay known after the pages that listed them are gone.
  watch(
    [remotePages.entries, selectedValues],
    ([entries, values]) => {
      if (!hasRemotePages.value || !values.length) return
      const picked = new Set(values.map(String))
      options.filters.selectedOptions.remember(
        options.definition.key,
        flattenRawOptionEntries(entries).filter((entry) => picked.has(String(entry.value))),
      )
    },
    { immediate: true },
  )
  /** Loaded pages, led by the committed values the pages do not list (with their resolved labels). */
  const remotePageEntries = computed<TableFilterOptionEntry[]>(() => {
    const listed = new Set(
      flattenRawOptionEntries(remotePages.entries.value).map((entry) => String(entry.value)),
    )
    const selected = options.filters.selectedOptions
      .getSelectedOptions(options.definition.key)
      .filter((entry) => !listed.has(String(entry.value)))
    return [...selected, ...remotePages.entries.value]
  })

  const optionQuery = useQuery<TableFilterOptionEntry[] | TableFilterOptionQueryResult>(
    computed(() => {
      const activeDefinition = optionDefinition.value

      if (
        !hasRemoteOptionQuery.value ||
        !activeDefinition ||
        !isFunction(activeDefinition.source?.query)
      ) {
        return {
          enabled: false,
          queryFn: async (): Promise<TableFilterOptionQueryResult> => ({ options: [] }),
          queryKey: ['table-filter-options', options.definition.key, 'disabled'],
        } satisfies TableQueryDefinition<
          TableFilterOptionEntry[] | TableFilterOptionQueryResult
        > & {
          enabled: boolean
        }
      }

      const queryOptions = unref(
        activeDefinition.source.query({
          cursor: undefined,
          limit: undefined,
          search: querySearch.value,
        }),
      )

      return {
        ...queryOptions,
        placeholderData: (
          previousData: TableFilterOptionEntry[] | TableFilterOptionQueryResult | undefined,
        ) => previousData,
        queryFn: queryOptions.queryFn,
        queryKey: queryOptions.queryKey,
        refetchOnWindowFocus: QUERY_DEFAULTS.refetchOnWindowFocus,
        staleTime: QUERY_DEFAULTS.staleTime.filterOptions,
      }
    }),
  )

  const perFilterFacetQuery = useQuery<TableFacetExecutionResult>(
    computed(() => {
      if (
        !isRemoteTable.value ||
        !usesFacetCounts.value ||
        !facetConfig.value?.query ||
        countsPagesRemotely.value
      ) {
        return {
          enabled: false,
          queryFn: async (): Promise<TableFacetExecutionResult> => ({ facets: [] }),
          queryKey: ['table-filter-facets', options.definition.key, 'disabled'],
        } satisfies TableQueryDefinition<TableFacetExecutionResult> & {
          enabled: boolean
        }
      }

      const queryOptions = unref(
        facetConfig.value.query({
          facets: [
            {
              cursor: undefined,
              key: options.definition.key,
              limit: facetConfig.value.limit,
              mode: resolveTableFacetMode(facetConfig.value),
              search: facetSearch.value,
            },
          ],
          table: options.queryContent.facetsBaseContext.value,
        }),
      )

      return {
        ...queryOptions,
        enabled: shouldResolveCounts.value,
        placeholderData: (previousData: TableFacetExecutionResult | undefined) => previousData,
        queryFn: queryOptions.queryFn,
        queryKey: queryOptions.queryKey,
        refetchOnWindowFocus: QUERY_DEFAULTS.refetchOnWindowFocus,
        staleTime: QUERY_DEFAULTS.staleTime.filterOptions,
      }
    }),
  )

  const remoteEntries = computed<TableFilterOptionEntry[]>(() => {
    if (!hasRemoteOptionQuery.value) {
      return []
    }

    const result = unref(optionQuery.data)
    if (Array.isArray(result)) {
      return [...result]
    }
    return result?.options ? [...result.options] : []
  })

  /**
   * Values each page facet request counts: the committed values the pages do not list, then each
   * loaded page. A new page adds one request instead of re-counting the earlier ones.
   */
  const pageFacetRequests = computed<(string | number | boolean)[][]>(() => {
    if (!countsPagesRemotely.value || !shouldResolveCounts.value) return []
    const paged = remotePages.pageValues.value
    const listed = new Set(paged.flat().map(String))
    const outside = options.filters.selectedOptions
      .getSelectedOptions(options.definition.key)
      .map((entry) => entry.value)
      .filter((value) => !listed.has(String(value)))
    return [outside, ...paged].filter((values) => values.length > 0)
  })
  const pageFacetQueries = useQueries({
    queries: computed(() => {
      const config = facetConfig.value
      const query = config?.query
      if (!query) return []
      return pageFacetRequests.value.map((values) => {
        const definition = unref(
          query({
            facets: [{ key: options.definition.key, mode: resolveTableFacetMode(config), values }],
            table: options.queryContent.facetsBaseContext.value,
          }),
        )
        return {
          // The table's own cache entry: it keeps the requested values next to their counts.
          queryFn: async (context: QueryFunctionContext): Promise<PageFacetCounts> => {
            if (!definition.queryFn) {
              throw new Error('facet.query must return a query definition with a queryFn.')
            }
            const result = await definition.queryFn({
              ...context,
              direction: 'forward',
              pageParam: null,
              queryKey: definition.queryKey,
            })
            return { result, values }
          },
          queryKey: ['table-filter-page-facets', ...definition.queryKey],
          refetchOnWindowFocus: QUERY_DEFAULTS.refetchOnWindowFocus,
          staleTime: QUERY_DEFAULTS.staleTime.filterOptions,
        }
      })
    }),
  })
  /** Counts of every requested page value; values the server left out count 0. */
  const pageFacetCounts = computed<TableFacetOptionResult[]>(() =>
    pageFacetQueries.value.flatMap((query) => {
      if (!query.data) return []
      const counted = new Map(
        query.data.result.facets
          .filter((facet) => facet.key === options.definition.key)
          .flatMap((facet) => facet.options)
          .map((option) => [String(option.value), option.count] as const),
      )
      return query.data.values.map((value) => ({ count: counted.get(String(value)) ?? 0, value }))
    }),
  )

  const facetCounts = computed<TableFacetOptionResult[]>(() => {
    if (!usesFacetCounts.value) {
      return []
    }
    if (countsPagesRemotely.value) {
      return pageFacetCounts.value
    }

    const facets =
      isRemoteTable.value && hasPerFilterFacetQuery.value
        ? (unref(perFilterFacetQuery.data)?.facets ?? [])
        : options.queryContent.facets.value.facets

    return (
      facets.find((facet: { key: string }) => facet.key === options.definition.key)?.options ?? []
    )
  })

  const resolvedFacetCounts = computed(() =>
    facetCounts.value.flatMap((entry) =>
      isPrimitiveFilterOptionValue(entry.value) ? [{ count: entry.count, value: entry.value }] : [],
    ),
  )
  const resolvedSourceTreeEntries = computed<TableResolvedFilterOptionEntry[]>(() =>
    resolveFilterOptionEntries({
      definition: options.definition,
      deriveCounts: false,
      facetCounts: resolvedFacetCounts.value,
      // Paged options without counts yet stay unknown (a placeholder) until their page is counted.
      missingCountFallback:
        shouldResolveCounts.value && usesFacetCounts.value && !countsPagesRemotely.value
          ? 0
          : undefined,
      options: hasRemotePages.value
        ? remotePageEntries.value
        : hasRemoteOptionQuery.value
          ? remoteEntries.value
          : staticEntries.value,
      authoritative: hasRemotePages.value,
      rows: [],
      selectedValues: selectedValues.value,
    }),
  )
  const sourceEntries = computed(() => flattenFilterOptionEntries(resolvedSourceTreeEntries.value))
  const selectableSourceEntries = computed(() =>
    sourceEntries.value.filter(
      (entry): entry is TableResolvedFilterOptionEntry & { value: string | number | boolean } =>
        !isNullish(entry.value),
    ),
  )

  const filteredTreeState = computed(() => {
    if (optionUi.value?.presentation !== 'tree') {
      const expandedIds: string[] = []
      return {
        entries: resolvedSourceTreeEntries.value,
        expandedIds,
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
          !isNullish(entry.value),
      )
    }

    if (!normalizedSearch.value.length || hasServerOptions.value) {
      return selectableSourceEntries.value
    }

    return selectableSourceEntries.value.filter((entry) =>
      entry.label.toLowerCase().includes(normalizedSearch.value.toLowerCase()),
    )
  })

  const isInitialLoading = computed(() =>
    hasRemotePages.value
      ? remotePages.isLoading.value
      : optionQuery.isLoading.value && !optionQuery.isPlaceholderData.value,
  )
  const isStaleLoading = computed(() =>
    hasRemotePages.value
      ? remotePages.isRefreshing.value
      : !isInitialLoading.value && optionQuery.isFetching.value,
  )
  const isCountLoading = computed(
    () =>
      isRemoteTable.value &&
      shouldResolveCounts.value &&
      !countsPagesRemotely.value &&
      perFilterFacetQuery.isFetching.value,
  )

  return {
    error: computed(
      () =>
        (hasRemotePages.value ? remotePages.error.value : optionQuery.error.value) ??
        perFilterFacetQuery.error.value,
    ),
    facetCounts,
    filteredEntries,
    filteredTreeEntries: computed(() => filteredTreeState.value.entries),
    isCountLoading,
    isError: computed(
      () =>
        (hasRemotePages.value ? remotePages.failed.value : optionQuery.isError.value) ||
        perFilterFacetQuery.isError.value,
    ),
    isLoading: isInitialLoading,
    isStaleLoading,
    refresh: () =>
      Promise.all([
        hasRemotePages.value ? remotePages.retry() : optionQuery.refetch(),
        perFilterFacetQuery.refetch(),
      ]),
    /** Paging of `source.remote`: the editor list loads the next page ahead of the scroll. */
    remote: {
      enabled: hasRemotePages,
      failed: remotePages.failed,
      hasMore: remotePages.hasMore,
      loadMore: remotePages.loadMore,
      loadingMore: remotePages.loadingMore,
      prefetchDistance: remotePages.prefetchDistance,
      retry: remotePages.retry,
    },
    searchExpandedIds: computed(() => filteredTreeState.value.expandedIds),
    showCounts: computed(() => shouldDeriveCounts.value && usesFacetCounts.value),
    sourceEntries: selectableSourceEntries,
    sourceTreeEntries: resolvedSourceTreeEntries,
  }
}

function flattenRawOptionEntries(
  entries: readonly TableFilterOptionEntry[],
): TableFilterOptionEntry[] {
  return entries.flatMap((entry) => [
    ...(isNullish(entry.value) ? [] : [entry]),
    ...flattenRawOptionEntries(entry.children ?? []),
  ])
}

function isFacetConfig(value: TableFilterFacetSpec | undefined): value is TableFilterFacetConfig {
  return isObject(value)
}

function getSelectedValues(options: { filters: ReturnType<typeof useTableFilters>; key: string }) {
  const rule = options.filters.getFilterState({ key: options.key })

  if (Array.isArray(rule?.value)) {
    return rule.value
  }
  if (!isNullish(rule?.value)) {
    return [rule.value]
  }
  return []
}

function isPrimitiveFilterOptionValue<TValue>(
  value: TValue,
): value is TValue & (string | number | boolean) {
  return isString(value) || isNumber(value) || isBoolean(value)
}
