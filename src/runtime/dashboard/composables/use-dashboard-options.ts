import type { QueryKey } from '@tanstack/vue-query'
import { computed, markRaw, shallowRef } from 'vue'

import type {
  DashboardOption,
  DashboardOptionsHandle,
  DashboardOptionsMenuBindings,
  DashboardRuntimeParam,
} from '../types'
import { resolveDashboardOptionValues } from '../utils/options'
import { useDashboardRemoteOptions } from './use-dashboard-remote-options'

/** Option handle of one option-backed param: static items, or a remote source. */
export function useDashboardOptions(params: {
  definition: DashboardRuntimeParam
  queryKey: QueryKey
  value: () => unknown
}): DashboardOptionsHandle {
  const { remote } = params.definition
  if (remote)
    return useDashboardRemoteOptions({
      config: remote,
      queryKey: params.queryKey,
      value: params.value,
    })
  return createStaticOptionsHandle(params.definition.items ?? [], params.value)
}

function createStaticOptionsHandle(
  items: readonly DashboardOption[],
  value: () => unknown,
): DashboardOptionsHandle {
  const search = shallowRef<string>('')
  const open = shallowRef<boolean>(false)
  const byValue = new Map(items.map((item) => [String(item.value), item]))
  const selected = computed<readonly DashboardOption[]>(() =>
    resolveDashboardOptionValues(value()).flatMap((entry) => byValue.get(entry) ?? []),
  )
  const menu: DashboardOptionsMenuBindings = {
    items: [...items],
    labelKey: 'label',
    valueKey: 'value',
  }

  return markRaw({
    error: undefined,
    hasMore: false,
    items,
    loading: false,
    loadingMore: false,
    loadMore() {},
    menu,
    get open() {
      return open.value
    },
    set open(next: boolean) {
      open.value = next
    },
    refresh: () => Promise.resolve(),
    get search() {
      return search.value
    },
    set search(next: string) {
      search.value = next
    },
    get selected() {
      return selected.value
    },
  })
}
