import { useInfiniteQuery, useQuery } from '@tanstack/vue-query'
import type { InfiniteData, QueryKey } from '@tanstack/vue-query'
import { refDebounced } from '@vueuse/core'
import { computed, markRaw, shallowRef } from 'vue'

import type { RemoteOptionsResult } from '../../shared/types/remote-options'
import { DASHBOARD_REMOTE_OPTIONS_DEFAULTS } from '../constants/query'
import type {
  DashboardOption,
  DashboardOptionsHandle,
  DashboardOptionsMenuBindings,
  DashboardRemoteOptionsConfig,
} from '../types'
import {
  mergeDashboardOptions,
  resolveDashboardOptionValues,
  resolveDashboardRemoteNextPage,
} from '../utils/options'
import type { DashboardRemotePageParam } from '../utils/options'

type RemotePage = RemoteOptionsResult<DashboardOption<string>>

/**
 * Remote option handle. Nothing loads until the picker opens or a search term is typed; pages are
 * cached per search term by TanStack Query, and selected values missing from the loaded pages are
 * hydrated through `resolveSelected` so URL-restored ids render their labels.
 */
export function useDashboardRemoteOptions(params: {
  config: DashboardRemoteOptionsConfig
  queryKey: QueryKey
  value: () => unknown
}): DashboardOptionsHandle {
  const { config } = params
  const queryKey = config.queryKey ?? params.queryKey
  const pageSize = config.pagination?.size ?? DASHBOARD_REMOTE_OPTIONS_DEFAULTS.pageSize
  const minLength = config.search?.minLength ?? 0
  const open = shallowRef<boolean>(false)
  const searchInput = shallowRef<string>('')
  const search = refDebounced(
    searchInput,
    config.search?.debounce ?? DASHBOARD_REMOTE_OPTIONS_DEFAULTS.searchDebounce,
  )

  const pages = useInfiniteQuery<
    RemotePage,
    Error,
    InfiniteData<RemotePage, DashboardRemotePageParam>,
    QueryKey,
    DashboardRemotePageParam
  >(
    computed(() => ({
      enabled:
        (open.value || searchInput.value !== '') &&
        (search.value.length === 0 || search.value.length >= minLength),
      getNextPageParam: (lastPage: RemotePage, allPages: RemotePage[]) =>
        resolveDashboardRemoteNextPage(lastPage, allPages.length),
      initialPageParam: { cursor: null, index: 1 },
      queryFn: ({ pageParam }: { pageParam: DashboardRemotePageParam }) =>
        config.load({ page: { ...pageParam, size: pageSize }, search: search.value }),
      queryKey: [...queryKey, 'options', search.value],
      staleTime: DASHBOARD_REMOTE_OPTIONS_DEFAULTS.staleTime,
    })),
  )

  const loaded = computed<readonly DashboardOption<string>[]>(
    () => pages.data.value?.pages.flatMap((page) => page.options) ?? [],
  )
  const loadedByValue = computed(
    () => new Map(loaded.value.map((option) => [option.value, option])),
  )
  const selectedValues = computed<string[]>(() => resolveDashboardOptionValues(params.value()))
  const missing = computed<string[]>(() =>
    selectedValues.value.filter((value) => !loadedByValue.value.has(value)),
  )

  const hydration = useQuery<
    readonly DashboardOption<string>[],
    Error,
    readonly DashboardOption<string>[],
    QueryKey
  >(
    computed(() => ({
      enabled: Boolean(config.resolveSelected) && missing.value.length > 0,
      queryFn: () => config.resolveSelected?.({ values: missing.value }) ?? Promise.resolve([]),
      queryKey: [...queryKey, 'selected', missing.value],
      staleTime: DASHBOARD_REMOTE_OPTIONS_DEFAULTS.selectedStaleTime,
    })),
  )

  const selected = computed<readonly DashboardOption[]>(() => {
    const hydrated = new Map((hydration.data.value ?? []).map((option) => [option.value, option]))
    return selectedValues.value.map(
      (value) => loadedByValue.value.get(value) ?? hydrated.get(value) ?? { label: value, value },
    )
  })
  const items = computed<DashboardOption[]>(() =>
    mergeDashboardOptions(loaded.value, selected.value),
  )
  const loading = computed<boolean>(
    () => (pages.isFetching.value && !pages.isFetchingNextPage.value) || hydration.isFetching.value,
  )

  function setSearch(next: string) {
    searchInput.value = next
  }

  function setOpen(next: boolean) {
    open.value = next
  }

  return markRaw({
    get error() {
      return pages.error.value ?? hydration.error.value
    },
    get hasMore() {
      return pages.hasNextPage.value
    },
    get items() {
      return items.value
    },
    get loading() {
      return loading.value
    },
    get loadingMore() {
      return pages.isFetchingNextPage.value
    },
    loadMore() {
      if (pages.hasNextPage.value && !pages.isFetchingNextPage.value) void pages.fetchNextPage()
    },
    get menu(): DashboardOptionsMenuBindings {
      return {
        ignoreFilter: true,
        items: items.value,
        labelKey: 'label',
        loading: loading.value,
        'onUpdate:open': setOpen,
        'onUpdate:searchTerm': setSearch,
        searchTerm: searchInput.value,
        valueKey: 'value',
      }
    },
    get open() {
      return open.value
    },
    set open(next: boolean) {
      setOpen(next)
    },
    async refresh() {
      await pages.refetch()
    },
    get search() {
      return searchInput.value
    },
    set search(next: string) {
      setSearch(next)
    },
    get selected() {
      return selected.value
    },
  })
}
