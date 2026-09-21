import { useInfiniteQuery } from '@tanstack/vue-query'
import type { InfiniteData, QueryKey } from '@tanstack/vue-query'
import { refDebounced } from '@vueuse/core'
import { computed } from 'vue'
import type { ComputedRef } from 'vue'

import type { RemoteOptionsResult } from '../../shared/types/remote-options'
import {
  REMOTE_OPTIONS_FIRST_PAGE,
  resolveRemoteOptionsNextPage,
} from '../../shared/utils/remote-options'
import type { RemoteOptionsPageParam } from '../../shared/utils/remote-options'
import { QUERY_DEFAULTS } from '../constants/query-state'
import type { TableFilterOptionEntry, TableFilterRemoteOptions } from '../types'

type RemotePage = RemoteOptionsResult<TableFilterOptionEntry>

/** Defaults of `source.remote` on option filters, matching the form engine's remote options. */
export const TABLE_REMOTE_FILTER_OPTIONS_DEFAULTS = {
  pageSize: 25,
  searchDebounce: 250,
} as const

export interface UseTableRemoteFilterOptionsParams {
  config: ComputedRef<TableFilterRemoteOptions | undefined>
  /** Raw search input; it is trimmed and debounced before it reaches the source. */
  search: ComputedRef<string>
  /** Pages load only while an editor shows the list. */
  enabled: ComputedRef<boolean>
}

/**
 * Pages of a remote option filter. Nothing loads until an editor shows the list; each search term
 * keeps its own pages in the TanStack Query cache, and the previous term's pages stay on screen
 * while the next term loads.
 */
export function useTableRemoteFilterOptions(params: UseTableRemoteFilterOptionsParams) {
  const pageSize = computed(() =>
    Math.max(
      1,
      params.config.value?.pagination?.size ?? TABLE_REMOTE_FILTER_OPTIONS_DEFAULTS.pageSize,
    ),
  )
  const minLength = computed(() => Math.max(0, params.config.value?.search?.minLength ?? 0))
  const search = refDebounced(
    computed(() => params.search.value.trim()),
    () =>
      params.config.value?.search?.debounce ?? TABLE_REMOTE_FILTER_OPTIONS_DEFAULTS.searchDebounce,
  )
  const canFetch = computed(
    () => search.value.length === 0 || search.value.length >= minLength.value,
  )

  const pages = useInfiniteQuery<
    RemotePage,
    Error,
    InfiniteData<RemotePage, RemoteOptionsPageParam>,
    QueryKey,
    RemoteOptionsPageParam
  >(
    computed(() => {
      const config = params.config.value
      const term = search.value
      const size = pageSize.value
      const firstPage = config?.load({ page: { ...REMOTE_OPTIONS_FIRST_PAGE, size }, search: term })

      return {
        enabled: Boolean(config) && params.enabled.value && canFetch.value,
        getNextPageParam: (lastPage: RemotePage, allPages: RemotePage[]) =>
          resolveRemoteOptionsNextPage(lastPage, allPages.length),
        initialPageParam: REMOTE_OPTIONS_FIRST_PAGE,
        // Keeps the previous term's options on screen while the next term loads.
        placeholderData: (previous: InfiniteData<RemotePage, RemoteOptionsPageParam> | undefined) =>
          previous,
        async queryFn(queryContext) {
          const definition = config?.load({
            page: { ...queryContext.pageParam, size },
            search: term,
          })
          if (!definition?.queryFn) {
            throw new Error('Remote option filters must return a query definition with a queryFn.')
          }
          return definition.queryFn({
            ...queryContext,
            direction: 'forward',
            pageParam: null,
            queryKey: definition.queryKey,
          })
        },
        queryKey: [
          ...(firstPage?.queryKey ?? ['table-filter-remote-options', 'disabled']),
          { tableFilterOptionPages: size },
        ],
        refetchOnWindowFocus: QUERY_DEFAULTS.refetchOnWindowFocus,
        staleTime: QUERY_DEFAULTS.staleTime.filterOptions,
      }
    }),
  )

  const entries = computed<readonly TableFilterOptionEntry[]>(
    () => pages.data.value?.pages.flatMap((page) => page.options) ?? [],
  )
  /** Option values of each loaded page, in page order: facet counts are requested page by page. */
  const pageValues = computed<(string | number | boolean)[][]>(
    () => pages.data.value?.pages.map((page) => collectOptionValues(page.options)) ?? [],
  )

  function loadMore() {
    if (!pages.hasNextPage.value || pages.isFetchingNextPage.value || pages.isFetching.value) return
    void pages.fetchNextPage()
  }

  return {
    entries,
    error: pages.error,
    /** More pages exist after the loaded ones. */
    hasMore: computed(() => pages.hasNextPage.value),
    /** The first page of the current term has not arrived yet. */
    isLoading: computed(() => pages.isLoading.value && !pages.isPlaceholderData.value),
    /** A new term, or a refetch, is loading while earlier options stay on screen. */
    isRefreshing: computed(
      () => pages.isFetching.value && !pages.isFetchingNextPage.value && !pages.isLoading.value,
    ),
    /** The next page is loading at the end of the list. */
    loadingMore: computed(() => pages.isFetchingNextPage.value),
    /** The last request failed: the next page (or the first) can be retried. */
    failed: computed(() => pages.isError.value || pages.isFetchNextPageError.value),
    loadMore,
    pageValues,
    prefetchDistance: computed(
      () => params.config.value?.pagination?.prefetchDistance ?? 'viewport',
    ),
    retry: () => (pages.isFetchNextPageError.value ? pages.fetchNextPage() : pages.refetch()),
  }
}

function collectOptionValues(
  options: readonly TableFilterOptionEntry[],
): (string | number | boolean)[] {
  return options.flatMap((option) => [
    ...(option.value === undefined ? [] : [option.value]),
    ...collectOptionValues(option.children ?? []),
  ])
}
