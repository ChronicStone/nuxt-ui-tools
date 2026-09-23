import type { QueryKey } from '@tanstack/vue-query'
import { computed, shallowRef } from 'vue'

import type { DashboardOption, DashboardRuntimeFilter } from '../types'
import type { DashboardRuntimeOptionList } from '../types/runtime'
import type { DashboardLocale } from '../utils/environment'
import { matchesDashboardSearch } from '../utils/options'
import { useDashboardRemoteOptions } from './use-dashboard-remote-options'

const noMenuBindings = computed(() => ({}))
const noError = computed<unknown>(() => undefined)
const off = computed<boolean>(() => false)

/**
 * Option list of one filter: static items (fixed, or read from data), or a remote source. Items of
 * values without labels of their own (`enum`, `boolean`) take their text from `format`, and
 * booleans and comparison periods fall back to localized labels.
 */
export function useDashboardOptions(params: {
  definition: DashboardRuntimeFilter
  queryKey: QueryKey
  locale: DashboardLocale
  value: () => unknown
}): DashboardRuntimeOptionList {
  const { definition } = params
  if (definition.remote)
    return useDashboardRemoteOptions({
      config: definition.remote,
      queryKey: params.queryKey,
      value: params.value,
    })

  const { t } = params.locale
  const search = shallowRef<string>('')
  const open = shallowRef<boolean>(false)

  function label(item: DashboardOption): string {
    if (definition.kind === 'comparison') return t(`dashboard.compare.${String(item.value)}`)
    if (definition.format && definition.kind !== 'options') return definition.format(item.value)
    if (definition.kind === 'boolean')
      return t(item.value === true ? 'dashboard.filters.yes' : 'dashboard.filters.no')
    return item.label
  }

  const all = computed<readonly DashboardOption[]>(() =>
    (definition.items?.() ?? []).map((item) => ({ ...item, label: label(item) })),
  )
  const known = computed(() => new Map(all.value.map((item) => [String(item.value), item])))
  const order = computed(() => new Map(all.value.map((item, index) => [String(item.value), index])))
  const items = computed<readonly DashboardOption[]>(() =>
    search.value
      ? all.value.filter((item) => matchesDashboardSearch(item.label, search.value))
      : all.value,
  )

  return {
    error: noError,
    hasMore: off,
    items,
    known,
    loadMore() {},
    loading: off,
    loadingMore: off,
    menu: noMenuBindings,
    open,
    order,
    refresh: () => Promise.resolve(),
    resolving: off,
    search,
  }
}
