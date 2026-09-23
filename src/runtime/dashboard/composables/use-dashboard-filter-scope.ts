import type { QueryKey } from '@tanstack/vue-query'
import { computed, isRef, markRaw, shallowRef } from 'vue'

import { useQueryStates } from '../../query-state'
import type { QueryStatesSchema } from '../../query-state'
import type { GenericObject } from '../../shared/types/utils'
import { hasProperty, isNullish } from '../../shared/utils/predicate'
import type { DashboardFilterControl, DashboardFilterLike, DashboardRuntimeFilter } from '../types'
import type { DashboardEnvironment } from '../utils/environment'
import { registerDashboardFilter } from '../utils/environment'
import { joinDashboardUrlKey, resolveDashboardCondition } from '../utils/state'
import { useDashboardFilterControl } from './use-dashboard-filter-control'

const emptyFacade = markRaw({})
const noUrlKeys: readonly string[] = []

/**
 * What one filter scope exposes. Declared rather than inferred: the inferred type would carry Vue's
 * `Raw<…>` marker, which declaration files cannot name.
 */
export interface DashboardFilterScope {
  keys: readonly string[]
  /** Controls, by filter key. */
  controls: Readonly<Record<string, DashboardFilterControl>>
  /** URL segments of this scope's URL-synced filters, before the dashboard prefix. */
  urlKeys: readonly string[]
  /** Writable facade: one getter / setter per filter. */
  values: object
  /** A filter that is enabled and not headless differs from its default. */
  changed: () => boolean
  /** Restores the default of every filter that is enabled and not headless. */
  reset: () => void
}

interface DashboardFilterAccessor {
  get: () => unknown
  set: (value: unknown) => void
}

/**
 * Owns the filters of one scope (dashboard root, a view, or a query): where each value lives (one
 * `useQueryStates` for the URL-synced ones, a ref per memory filter, the external ref or getter of
 * synced ones), a writable values facade, and one control per filter. Scopes without filters
 * allocate nothing.
 *
 * A URL key names one filter across the dashboard: scopes declaring the same key read and write the
 * same value, and must declare it the same way.
 */
export function useDashboardFilterScope(params: {
  definitions: Readonly<Record<string, DashboardFilterLike>>
  /** Where the scope sits, for error messages: `view "consumption"`. */
  owner: string
  prefix: string
  queryKey: QueryKey
  environment: DashboardEnvironment
}): DashboardFilterScope {
  const entries = Object.entries(params.definitions).flatMap(([key, definition]) =>
    isRuntimeFilter(definition) ? [[key, definition] as const] : [],
  )
  if (entries.length === 0)
    return {
      changed: () => false,
      controls: emptyFacade,
      keys: [],
      reset() {},
      urlKeys: noUrlKeys,
      values: emptyFacade,
    }

  const urlEntries = entries.filter(([, definition]) => (definition.sync ?? 'url') === 'url')
  const schema: QueryStatesSchema = {}
  for (const [key, definition] of urlEntries) {
    registerDashboardFilter(params.environment.registry, {
      definition,
      owner: `${params.owner} ("${key}")`,
      urlKey: joinDashboardUrlKey(params.prefix, definition.urlKey ?? key),
    })
    schema[key] = {
      codec: definition.codec,
      defaultValue: definition.defaultValue,
      historyMode: definition.historyMode,
      omitDefault: definition.omitDefault,
      urlKey: definition.urlKey,
    }
  }
  const state =
    urlEntries.length > 0
      ? useQueryStates({ historyMode: 'replace', prefix: params.prefix, schema })
      : null

  function createAccessor(
    key: string,
    definition: DashboardRuntimeFilter,
  ): DashboardFilterAccessor {
    const { defaultValue, sync = 'url' } = definition
    if (sync === 'url' && state) {
      return {
        get: () => {
          const current: GenericObject = state.value
          return current[key]
        },
        set: (value) => {
          state.value = { ...state.value, [key]: value }
        },
      }
    }
    if (sync === 'url' || sync === 'memory') {
      const cell = shallowRef<unknown>(defaultValue)
      return { get: () => cell.value, set: (value) => (cell.value = value) }
    }
    if (isRef(sync)) return { get: () => sync.value, set: (value) => (sync.value = value) }
    // A getter is a read-only source: writes are ignored.
    return { get: () => sync(), set() {} }
  }

  const values = {}
  const controls: Record<string, DashboardFilterControl> = {}
  for (const [key, definition] of entries) {
    const accessor = createAccessor(key, definition)
    const { codec, multiple } = definition
    const enabled = () => resolveDashboardCondition(definition.enabled)
    /**
     * An unset value (nullish, or an empty list) reads as the current default, and so does the
     * value of a disabled filter, whatever its store holds.
     */
    const get = () => {
      if (!enabled()) return definition.resolveDefault()
      const value = accessor.get()
      const unset = isNullish(value) || (multiple && Array.isArray(value) && value.length === 0)
      return unset ? definition.resolveDefault() : value
    }
    /**
     * Writing `null` / `undefined` (e.g. a cleared picker) restores the default. A value equal to
     * the current default is stored unset, so it stays out of the URL and follows a default getter.
     */
    const set = (value: unknown) => {
      if (!enabled()) return
      const next = value ?? definition.resolveDefault()
      const isDefault = codec.serialize(next) === codec.serialize(definition.resolveDefault())
      accessor.set(isDefault ? definition.defaultValue : next)
    }
    Object.defineProperty(values, key, { enumerable: true, get, set })
    definition.bind(get)
    controls[key] = useDashboardFilterControl({
      definition,
      get,
      key,
      locale: params.environment.locale,
      queryKey: [...params.queryKey, key],
      set,
    })
  }

  const visible = Object.values(controls).filter((control) => !control.headless)
  const changed = computed<boolean>(() =>
    visible.some((control) => control.enabled && control.changed),
  )

  return {
    changed: () => changed.value,
    controls: markRaw(controls),
    keys: entries.map(([key]) => key),
    reset() {
      for (const control of visible) if (control.enabled) control.reset()
    },
    urlKeys: urlEntries.map(([key, definition]) => definition.urlKey ?? key),
    values: markRaw(values),
  }
}

function isRuntimeFilter(definition: DashboardFilterLike): definition is DashboardRuntimeFilter {
  return hasProperty(definition, 'codec')
}
