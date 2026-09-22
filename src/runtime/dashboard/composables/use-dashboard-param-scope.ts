import type { QueryKey } from '@tanstack/vue-query'
import { computed, isRef, markRaw, shallowRef } from 'vue'

import { useQueryStates } from '../../query-state'
import type { QueryStatesSchema } from '../../query-state'
import type { GenericObject } from '../../shared/types/utils'
import { hasProperty } from '../../shared/utils/predicate'
import type { DashboardFilterHandle, DashboardParamLike, DashboardRuntimeParam } from '../types'
import { useDashboardFilter } from './use-dashboard-filter'

const emptyFacade = markRaw({})
const noUrlKeys: readonly string[] = []

/**
 * What one param scope exposes. Declared rather than inferred: the inferred type would carry Vue's
 * `Raw<…>` marker, which declaration files cannot name.
 */
export interface DashboardParamScope {
  keys: readonly string[]
  /** Filter handles, by param key. */
  filters: Readonly<Record<string, DashboardFilterHandle>>
  /** URL segments of this scope's URL-synced params, before the scope prefix. */
  urlKeys: readonly string[]
  /** Writable facade: one getter / setter per param. */
  values: object
  /** A filter that is not headless differs from its default. */
  changed: () => boolean
  /** Restores the default of every filter that is not headless. */
  reset: () => void
}

interface DashboardParamAccessor {
  get: () => unknown
  set: (value: unknown) => void
}

/**
 * Owns the params of one scope (dashboard root, a view, or a query's widget params): where each
 * value lives (one `useQueryStates` for the URL-synced ones, a ref per memory param, the external
 * ref or getter of synced ones), a writable values facade, and one filter handle per param. Scopes
 * without params allocate nothing.
 */
export function useDashboardParamScope(params: {
  definitions: Readonly<Record<string, DashboardParamLike>>
  prefix: string
  queryKey: QueryKey
}): DashboardParamScope {
  const entries = Object.entries(params.definitions).flatMap(([key, definition]) =>
    isRuntimeParam(definition) ? [[key, definition] as const] : [],
  )
  if (entries.length === 0)
    return {
      changed: () => false,
      filters: emptyFacade,
      keys: [],
      reset() {},
      urlKeys: noUrlKeys,
      values: emptyFacade,
    }

  const urlEntries = entries.filter(([, definition]) => (definition.sync ?? 'url') === 'url')
  const schema: QueryStatesSchema = {}
  for (const [key, definition] of urlEntries) {
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

  function createAccessor(key: string, definition: DashboardRuntimeParam): DashboardParamAccessor {
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
    if (isRef(sync)) {
      return { get: () => sync.value ?? defaultValue, set: (value) => (sync.value = value) }
    }
    // A getter is a read-only source: writes are ignored.
    return { get: () => sync() ?? defaultValue, set() {} }
  }

  const values = {}
  const filters: Record<string, DashboardFilterHandle> = {}
  for (const [key, definition] of entries) {
    const accessor = createAccessor(key, definition)
    /** Writing `null` / `undefined` (e.g. a cleared picker) restores the default value. */
    const set = (value: unknown) => accessor.set(value ?? definition.defaultValue)
    Object.defineProperty(values, key, { enumerable: true, get: accessor.get, set })
    filters[key] = useDashboardFilter({
      definition,
      get: accessor.get,
      key,
      queryKey: [...params.queryKey, key],
      set,
    })
  }

  const visible = Object.values(filters).filter((filter) => !filter.headless)
  const changed = computed<boolean>(() => visible.some((filter) => filter.changed))

  return {
    changed: () => changed.value,
    filters: markRaw(filters),
    keys: entries.map(([key]) => key),
    reset() {
      for (const filter of visible) filter.reset()
    },
    urlKeys: urlEntries.map(([key, definition]) => definition.urlKey ?? key),
    values: markRaw(values),
  }
}

/**
 * Exposes several scopes through one object, e.g. the root params plus a view's own params inside
 * the view's builders and on its handle. Reads and writes go straight to the owning scope.
 */
export function mergeDashboardParamScopes(
  scopes: readonly DashboardParamScope[],
): Pick<DashboardParamScope, 'changed' | 'filters' | 'reset' | 'values'> {
  if (scopes.length === 1 && scopes[0]) return scopes[0]
  const values = {}
  const filters: Record<string, DashboardFilterHandle> = {}
  for (const scope of scopes) {
    for (const key of scope.keys) {
      Object.defineProperty(values, key, {
        enumerable: true,
        get: () => Reflect.get(scope.values, key),
        set: (value: unknown) => Reflect.set(scope.values, key, value),
      })
      const filter = scope.filters[key]
      if (filter) filters[key] = filter
    }
  }
  return {
    changed: () => scopes.some((scope) => scope.changed()),
    filters: markRaw(filters),
    reset() {
      for (const scope of scopes) scope.reset()
    },
    values: markRaw(values),
  }
}

function isRuntimeParam(definition: DashboardParamLike): definition is DashboardRuntimeParam {
  return hasProperty(definition, 'codec')
}
