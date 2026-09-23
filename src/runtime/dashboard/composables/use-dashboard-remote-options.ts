import { useInfiniteQuery, useQuery } from '@tanstack/vue-query'
import type { InfiniteData, QueryKey } from '@tanstack/vue-query'
import { refDebounced } from '@vueuse/core'
import { computed, shallowRef } from 'vue'

import type { RemoteOptionsResult } from '../../shared/types/remote-options'
import {
  REMOTE_OPTIONS_FIRST_PAGE,
  resolveRemoteOptionsNextPage,
} from '../../shared/utils/remote-options'
import type { RemoteOptionsPageParam } from '../../shared/utils/remote-options'
import { DASHBOARD_REMOTE_OPTIONS_DEFAULTS } from '../constants/query'
import type {
  DashboardOption,
  DashboardOptionsMenuBindings,
  DashboardRemoteOptionsConfig,
} from '../types'
import type { DashboardRuntimeOptionList } from '../types/runtime'
import { mergeDashboardOptions, resolveDashboardOptionValues } from '../utils/options'
import { runDashboardRemoteResult } from '../utils/remote'

type RemotePage = RemoteOptionsResult<DashboardOption<string>>

/**
 * Remote option list. Nothing loads until the picker opens or a search term is typed; pages are
 * cached per search term by TanStack Query (the previous term's options stay on screen while the
 * next one loads), and selected values missing from the loaded pages are hydrated through
 * `resolveSelected` so URL-restored ids render their labels. Sources may return query definitions
 * or promises.
 */
export function useDashboardRemoteOptions(params: {
  config: DashboardRemoteOptionsConfig
  queryKey: QueryKey
  value: () => unknown
}): DashboardRuntimeOptionList {
  const { config } = params
  const queryKey = config.queryKey ?? params.queryKey
  const pageSize = Math.max(
    1,
    config.pagination?.size ?? DASHBOARD_REMOTE_OPTIONS_DEFAULTS.pageSize,
  )
  const minLength = config.search?.minLength ?? 0
  const open = shallowRef<boolean>(false)
  const search = shallowRef<string>('')
  const term = refDebounced(
    computed(() => search.value.trim()),
    config.search?.debounce ?? DASHBOARD_REMOTE_OPTIONS_DEFAULTS.searchDebounce,
  )

  const pages = useInfiniteQuery<
    RemotePage,
    Error,
    InfiniteData<RemotePage, RemoteOptionsPageParam>,
    QueryKey,
    RemoteOptionsPageParam
  >(
    computed(() => ({
      enabled:
        (open.value || search.value !== '') &&
        (term.value.length === 0 || term.value.length >= minLength),
      getNextPageParam: (lastPage: RemotePage, allPages: RemotePage[]) =>
        resolveRemoteOptionsNextPage(lastPage, allPages.length),
      initialPageParam: REMOTE_OPTIONS_FIRST_PAGE,
      // Keeps the previous term's options on screen while the next term loads.
      placeholderData: (previous: InfiniteData<RemotePage, RemoteOptionsPageParam> | undefined) =>
        previous,
      queryFn: (context) =>
        runDashboardRemoteResult(
          config.load({ page: { ...context.pageParam, size: pageSize }, search: term.value }),
          context,
        ),
      queryKey: [...queryKey, 'options', term.value],
      staleTime: DASHBOARD_REMOTE_OPTIONS_DEFAULTS.staleTime,
    })),
  )

  const loaded = computed<readonly DashboardOption<string>[]>(
    () => pages.data.value?.pages.flatMap((page) => page.options) ?? [],
  )
  const loadedByValue = computed(
    () => new Map(loaded.value.map((option) => [option.value, option])),
  )
  const missing = computed<string[]>(() =>
    resolveDashboardOptionValues(params.value()).filter((value) => !loadedByValue.value.has(value)),
  )

  const hydration = useQuery<
    readonly DashboardOption<string>[],
    Error,
    readonly DashboardOption<string>[],
    QueryKey
  >(
    computed(() => ({
      enabled: Boolean(config.resolveSelected) && missing.value.length > 0,
      queryFn: (context) =>
        config.resolveSelected
          ? runDashboardRemoteResult(config.resolveSelected({ values: missing.value }), context)
          : Promise.resolve([]),
      queryKey: [...queryKey, 'selected', missing.value],
      // Hydrated labels stay while the next set of missing values resolves.
      placeholderData: (previous: readonly DashboardOption<string>[] | undefined) => previous,
      staleTime: DASHBOARD_REMOTE_OPTIONS_DEFAULTS.selectedStaleTime,
    })),
  )

  const hydrated = computed<readonly DashboardOption<string>[]>(() => hydration.data.value ?? [])
  const known = computed<ReadonlyMap<string, DashboardOption>>(
    () =>
      new Map(
        mergeDashboardOptions(loaded.value, hydrated.value).map((option) => [
          String(option.value),
          option,
        ]),
      ),
  )
  // Selected options the pages do not contain stay listed, except while searching.
  const items = computed<readonly DashboardOption[]>(() =>
    term.value
      ? loaded.value
      : mergeDashboardOptions(
          loaded.value,
          hydrated.value.filter((option) => missing.value.includes(option.value)),
        ),
  )
  const loading = computed<boolean>(() => pages.isFetching.value && !pages.isFetchingNextPage.value)
  const menu = computed<Partial<DashboardOptionsMenuBindings>>(() => ({
    ignoreFilter: true,
    loading: loading.value,
    'onUpdate:open': (next: boolean) => {
      open.value = next
    },
    'onUpdate:searchTerm': (next: string) => {
      search.value = next
    },
    searchTerm: search.value,
  }))

  return {
    error: computed<unknown>(() => pages.error.value ?? hydration.error.value ?? undefined),
    hasMore: computed<boolean>(() => pages.hasNextPage.value),
    items,
    known,
    loadMore() {
      if (!pages.hasNextPage.value || pages.isFetching.value) return
      void pages.fetchNextPage()
    },
    loading,
    loadingMore: computed<boolean>(() => pages.isFetchingNextPage.value),
    menu,
    open,
    order: computed(() => null),
    async refresh() {
      await pages.refetch()
    },
    resolving: computed<boolean>(() => hydration.isFetching.value),
    search,
  }
}
