import { useQuery } from '@tanstack/vue-query'
import { computed, unref, type ComputedRef, type Ref } from 'vue'

import type {
  TableBooleanFilterDefinition,
  TableFacetExecutionResult,
  TableFacetOptionResult,
  TableFilterOptionEntry,
  TableFilterFacetMode,
  TableFilterOptionQueryResult,
  TableOptionFilterDefinition,
  TableQueryDefinition,
  TableRemoteSource,
  TableSchemaView,
} from '../types'
import type { UseTableDataReturn } from './use-table-data'
import type { useTableFilters } from './use-table-filters'

type ResolvedFilterOptionEntry = {
  label: string
  value: string | number | boolean
  count?: number
}

function resolveFacetMode(options: { facet: TableFilterFacetMode | undefined }) {
  if (!options.facet) {
    return undefined
  }

  if (options.facet === true) {
    return 'exclude-self'
  }

  return options.facet
}

export interface UseTableFilterOptionsParams {
  definition: TableOptionFilterDefinition | TableBooleanFilterDefinition
  searchQuery: Ref<string>
  filters: ReturnType<typeof useTableFilters>
  queryContent: UseTableDataReturn
  schema: ComputedRef<TableSchemaView>
}

export function useTableFilterOptions(options: UseTableFilterOptionsParams) {
  const normalizedSearch = computed(() => options.searchQuery.value.trim())
  const isBooleanFilter = computed(() => options.definition.kind === 'boolean')
  const isRemoteTable = computed(() => options.schema.value.source.mode === 'remote')
  const hasRemoteOptionQuery = computed(
    () => options.definition.kind === 'option' && typeof options.definition.query === 'function',
  )
  const usesFacetCounts = computed(
    () =>
      isRemoteTable.value &&
      Boolean(options.definition.facet) &&
      typeof (options.schema.value.source as TableRemoteSource).facets === 'function',
  )
  const canMergeFacetCounts = computed(() => !isRemoteTable.value || usesFacetCounts.value)

  const staticEntries = computed<TableFilterOptionEntry[]>(() => {
    if (options.definition.kind !== 'option') {
      return []
    }

    return options.definition.options ?? []
  })

  const optionQuery = useQuery<TableFilterOptionEntry[] | TableFilterOptionQueryResult>(
    computed(() => {
      if (!hasRemoteOptionQuery.value || options.definition.kind !== 'option') {
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

      const optionDefinition = options.definition as TableOptionFilterDefinition
      const queryOptions = unref(
        optionDefinition.query!({
          search: normalizedSearch.value || undefined,
          limit: undefined,
          cursor: undefined,
        }),
      )

      return {
        ...queryOptions,
        queryKey: queryOptions.queryKey,
        queryFn: queryOptions.queryFn,
        placeholderData: (
          previousData: TableFilterOptionEntry[] | TableFilterOptionQueryResult | undefined,
        ) => previousData,
      } satisfies TableQueryDefinition<TableFilterOptionEntry[] | TableFilterOptionQueryResult> & {
        placeholderData: (
          previousData: TableFilterOptionEntry[] | TableFilterOptionQueryResult | undefined,
        ) => TableFilterOptionEntry[] | TableFilterOptionQueryResult | undefined
      }
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
        (options.schema.value.source as TableRemoteSource).facets!({
          table: options.queryContent.requestContext.value,
          facets: [
            {
              key: options.definition.key,
              mode: resolveFacetMode({
                facet: options.definition.facet,
              }),
              search: normalizedSearch.value || undefined,
              limit: undefined,
              cursor: undefined,
            },
          ],
        }),
      )

      return {
        ...queryOptions,
        queryKey: queryOptions.queryKey,
        queryFn: queryOptions.queryFn,
        placeholderData: (previousData: TableFacetExecutionResult | undefined) => previousData,
      } satisfies TableQueryDefinition<TableFacetExecutionResult> & {
        placeholderData: (
          previousData: TableFacetExecutionResult | undefined,
        ) => TableFacetExecutionResult | undefined
      }
    }),
  )

  const remoteEntries = computed<TableFilterOptionEntry[]>(() => {
    if (!hasRemoteOptionQuery.value) {
      return []
    }

    const result = unref(optionQuery.data)

    if (Array.isArray(result)) {
      return result
    }

    return result?.options ?? []
  })

  const facetCounts = computed<TableFacetOptionResult[]>(() => {
    if (!usesFacetCounts.value) {
      return []
    }

    return (
      (unref(facetQuery.data)?.facets ?? []).find(
        (facet: { key: string }) => facet.key === options.definition.key,
      )?.options ?? []
    )
  })

  const sourceEntries = computed<ResolvedFilterOptionEntry[]>(() => {
    if (isBooleanFilter.value) {
      return []
    }

    const entries = hasRemoteOptionQuery.value ? remoteEntries.value : staticEntries.value
    const countByValue = new Map(
      facetCounts.value.map((entry) => [String(entry.value), entry.count] as const),
    )

    return entries.map((entry) => ({
      ...entry,
      label: options.filters.getFilterLabelText({
        label: entry.label,
      }),
      count:
        entry.count ??
        (canMergeFacetCounts.value ? countByValue.get(String(entry.value)) : undefined),
    }))
  })

  const optionEntries = computed(() =>
    options.filters.getFilterOptionEntries({
      key: options.definition.key,
      entries: sourceEntries.value,
      facetCounts: facetCounts.value.map((entry) => ({
        value: entry.value as string | number | boolean,
        count: entry.count,
      })),
    }),
  )

  const filteredEntries = computed(() => {
    if (!normalizedSearch.value.length || hasRemoteOptionQuery.value) {
      return optionEntries.value
    }

    return optionEntries.value.filter((entry: { label: string }) =>
      entry.label.toLowerCase().includes(normalizedSearch.value.toLowerCase()),
    )
  })

  // True only on the very first fetch — no data available at all yet (no placeholder)
  const isInitialLoading = computed(
    () =>
      (optionQuery.isLoading.value && !optionQuery.isPlaceholderData.value) ||
      (facetQuery.isLoading.value && !facetQuery.isPlaceholderData.value),
  )

  const isStaleLoading = computed(
    () =>
      !isInitialLoading.value &&
      (optionQuery.isFetching.value || facetQuery.isFetching.value),
  )

  return {
    sourceEntries,
    optionEntries,
    filteredEntries,
    facetCounts,
    isLoading: isInitialLoading,
    isStaleLoading,
    isError: computed(() => optionQuery.isError.value || facetQuery.isError.value),
    error: computed(() => optionQuery.error.value ?? facetQuery.error.value),
    refresh: () => Promise.all([optionQuery.refetch(), facetQuery.refetch()]),
  }
}
