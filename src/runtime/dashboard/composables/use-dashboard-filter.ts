import type { QueryKey } from '@tanstack/vue-query'
import { computed, markRaw } from 'vue'

import { useUiToolsLocale } from '../../i18n/use-locale'
import { isNullish } from '../../shared/utils/predicate'
import { resolveTextValue } from '../../shared/utils/render'
import type {
  DashboardFilterHandle,
  DashboardFilterPreset,
  DashboardOption,
  DashboardOptionsMenuBindings,
  DashboardOptionValue,
  DashboardRuntimeParam,
} from '../types'
import {
  formatDashboardParamValue,
  isDashboardOptionValue,
  isDashboardParamHeadless,
} from '../utils/filters'
import { useDashboardOptions } from './use-dashboard-options'

/**
 * Filter handle of one param: its value and presentation (label, display text, option list) plus
 * the actions pickers perform (`toggle`, `reset`). It owns no state of its own besides the option
 * list; the value lives wherever the param syncs it.
 */
export function useDashboardFilter(params: {
  key: string
  definition: DashboardRuntimeParam
  queryKey: QueryKey
  get: () => unknown
  set: (value: unknown) => void
}): DashboardFilterHandle {
  const { definition, get, set } = params
  const { code, t } = useUiToolsLocale()
  const options = useDashboardOptions({ definition, queryKey: params.queryKey, value: get })
  const listed = definition.items !== undefined || definition.remote !== undefined
  const defaultKey = definition.codec.serialize(definition.defaultValue)

  const label = computed(() => resolveTextValue(definition.label, params.key))
  const placeholder = computed(() =>
    resolveTextValue(definition.placeholder, t('dashboard.filters.all')),
  )
  const changed = computed<boolean>(() => definition.codec.serialize(get()) !== defaultKey)
  /** Option values of the current value, in value order. */
  const values = computed<DashboardOptionValue[]>(() => {
    const value = get()
    const list = Array.isArray(value) ? value : [value]
    return list.filter(isDashboardOptionValue)
  })
  const keys = computed(() => new Set(values.value.map(String)))

  const selected = computed<readonly DashboardOption[]>(() =>
    values.value.map(
      (value) =>
        options.known.value.get(String(value)) ?? {
          label: options.resolving.value ? '…' : describe(value),
          value,
        },
    ),
  )

  const display = computed<string>(() => {
    const value = get()
    if (isNullish(value) || (Array.isArray(value) && value.length === 0)) return placeholder.value
    const [first, second] = selected.value
    if (!first) return describe(value)
    if (!second) return first.label
    return selected.value.length === 2
      ? `${first.label}, ${second.label}`
      : t('dashboard.filters.more', { count: selected.value.length - 1, label: first.label })
  })

  function describe(value: unknown) {
    return definition.format
      ? definition.format(value)
      : formatDashboardParamValue(value, code.value)
  }

  const presets = computed<readonly DashboardFilterPreset[]>(() => {
    const current = definition.codec.serialize(get())
    return (definition.presets?.() ?? []).map((preset) => ({
      active: definition.codec.serialize(preset.value) === current,
      apply: () => set(preset.value),
      hint: preset.hint,
      icon: preset.icon,
      label: resolveTextValue(preset.label),
      value: preset.value,
    }))
  })

  const menu = computed<DashboardOptionsMenuBindings>(() => ({
    items: [...options.items.value],
    labelKey: 'label',
    multiple: definition.multiple,
    valueKey: 'value',
    ...options.menu.value,
  }))

  function toggle(value: DashboardOptionValue) {
    if (!definition.multiple) return set(value)
    const current = Array.isArray(get()) ? values.value : []
    const key = String(value)
    if (keys.value.has(key)) return set(current.filter((entry) => String(entry) !== key))
    if (definition.max !== undefined && current.length >= definition.max) return
    const order = options.order.value
    const next = [...current, value]
    if (order) {
      const rank = (entry: DashboardOptionValue) => order.get(String(entry)) ?? order.size
      next.sort((first, second) => rank(first) - rank(second))
    }
    set(next)
  }

  return markRaw({
    get changed() {
      return changed.value
    },
    get columns() {
      return definition.columns
    },
    get defaultValue() {
      return definition.defaultValue
    },
    get display() {
      return display.value
    },
    get error() {
      return options.error.value
    },
    get hasMore() {
      return options.hasMore.value
    },
    headless: isDashboardParamHeadless(definition),
    isSelected: (value: DashboardOptionValue) => keys.value.has(String(value)),
    get items() {
      return listed ? options.items.value : []
    },
    key: params.key,
    kind: definition.kind,
    get label() {
      return label.value
    },
    get loading() {
      return options.loading.value
    },
    get loadingMore() {
      return options.loadingMore.value
    },
    loadMore: options.loadMore,
    max: definition.max,
    get menu() {
      return menu.value
    },
    multiple: definition.multiple,
    get open() {
      return options.open.value
    },
    set open(next: boolean) {
      options.open.value = next
    },
    get placeholder() {
      return placeholder.value
    },
    get presets() {
      return presets.value
    },
    refresh: options.refresh,
    reset: () => set(definition.defaultValue),
    get search() {
      return options.search.value
    },
    set search(next: string) {
      options.search.value = next
    },
    searchable: definition.searchable === true,
    get selected() {
      return selected.value
    },
    toggle,
    get value() {
      return get()
    },
    set value(next: unknown) {
      set(next)
    },
  })
}
