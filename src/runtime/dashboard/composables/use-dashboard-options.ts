import type { QueryKey } from '@tanstack/vue-query'
import { computed, markRaw, shallowRef } from 'vue'

import { useUiToolsLocale } from '../../i18n/use-locale'
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
  const { definition } = params
  if (definition.remote)
    return useDashboardRemoteOptions({
      config: definition.remote,
      queryKey: params.queryKey,
      value: params.value,
    })
  const items = definition.items ?? []
  if (definition.kind !== 'comparison') return createStaticOptionsHandle(() => items, params.value)

  // Comparison modes carry their labels in the library messages, so they follow the locale.
  const { t } = useUiToolsLocale()
  const localized = computed(() =>
    items.map((item) => ({ ...item, label: t(`dashboard.compare.${String(item.value)}`) })),
  )
  return createStaticOptionsHandle(() => localized.value, params.value)
}

function createStaticOptionsHandle(
  items: () => readonly DashboardOption[],
  value: () => unknown,
): DashboardOptionsHandle {
  const search = shallowRef<string>('')
  const open = shallowRef<boolean>(false)
  const byValue = computed(() => new Map(items().map((item) => [String(item.value), item])))
  const selected = computed<readonly DashboardOption[]>(() =>
    resolveDashboardOptionValues(value()).flatMap((entry) => byValue.value.get(entry) ?? []),
  )
  const menu = computed<DashboardOptionsMenuBindings>(() => ({
    items: [...items()],
    labelKey: 'label',
    valueKey: 'value',
  }))

  return markRaw({
    error: undefined,
    hasMore: false,
    get items() {
      return items()
    },
    loading: false,
    loadingMore: false,
    loadMore() {},
    get menu() {
      return menu.value
    },
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
