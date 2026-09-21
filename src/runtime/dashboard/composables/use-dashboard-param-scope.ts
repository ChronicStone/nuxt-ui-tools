import type { QueryKey } from '@tanstack/vue-query'
import { markRaw } from 'vue'

import { useQueryStates } from '../../query-state'
import type { QueryStatesSchema } from '../../query-state'
import type { GenericObject } from '../../shared/types/utils'
import { hasProperty } from '../../shared/utils/predicate'
import type {
  DashboardOptionsHandle,
  DashboardParamLike,
  DashboardParamMap,
  DashboardRuntimeParam,
} from '../types'
import { useDashboardOptions } from './use-dashboard-options'

const emptyFacade = markRaw({})
const noUrlKeys: readonly string[] = []

/**
 * What one param scope exposes. Declared rather than inferred: the inferred type would carry Vue's
 * `Raw<…>` marker, which declaration files cannot name.
 */
export interface DashboardParamScope {
  keys: readonly string[]
  /** Option handles of option-backed params, by param key. */
  options: Readonly<Record<string, DashboardOptionsHandle>>
  /** URL segments of this scope's params, before the scope prefix. */
  urlKeys: readonly string[]
  /** Writable facade: one getter / setter per param. */
  values: object
}

/**
 * Owns the params of one scope (dashboard root, a view, or a query's widget params): exactly one
 * `useQueryStates` instance, a writable values facade, and the option handles of option-backed
 * params. Scopes without params allocate nothing.
 */
export function useDashboardParamScope(params: {
  definitions: DashboardParamMap
  prefix: string
  queryKey: QueryKey
}): DashboardParamScope {
  const entries = Object.entries(params.definitions).flatMap(([key, definition]) =>
    isRuntimeParam(definition) ? [[key, definition] as const] : [],
  )
  if (entries.length === 0)
    return { keys: [], options: emptyFacade, urlKeys: noUrlKeys, values: emptyFacade }

  const schema: QueryStatesSchema = {}
  for (const [key, definition] of entries) {
    schema[key] = {
      codec: definition.codec,
      defaultValue: definition.defaultValue,
      historyMode: definition.historyMode,
      omitDefault: definition.omitDefault,
      urlKey: definition.urlKey,
    }
  }
  const state = useQueryStates({ historyMode: 'replace', prefix: params.prefix, schema })

  function read(key: string): unknown {
    const current: GenericObject = state.value
    return current[key]
  }

  /** Writing `null` / `undefined` (e.g. a cleared picker) restores the default value. */
  function write(key: string, value: unknown) {
    state.value = { ...state.value, [key]: value ?? params.definitions[key]?.defaultValue }
  }

  const values = {}
  for (const [key] of entries) {
    Object.defineProperty(values, key, {
      enumerable: true,
      get: () => read(key),
      set: (value: unknown) => write(key, value),
    })
  }

  const options: Record<string, DashboardOptionsHandle> = {}
  for (const [key, definition] of entries) {
    if (!definition.items && !definition.remote) continue
    options[key] = useDashboardOptions({
      definition,
      queryKey: [...params.queryKey, key],
      value: () => read(key),
    })
  }

  return {
    keys: entries.map(([key]) => key),
    options: markRaw(options),
    /** URL segments of this scope's params, before the scope prefix. */
    urlKeys: entries.map(([key, definition]) => definition.urlKey ?? key),
    values: markRaw(values),
  }
}

/**
 * Exposes several scopes' values through one object, e.g. shared params plus a view's own params
 * inside the view's query factories. Reads and writes go straight to the owning scope.
 */
export function mergeDashboardParamValues(scopes: readonly DashboardParamScope[]): object {
  const merged = {}
  for (const scope of scopes) {
    for (const key of scope.keys) {
      Object.defineProperty(merged, key, {
        enumerable: true,
        get: () => Reflect.get(scope.values, key),
        set: (value: unknown) => Reflect.set(scope.values, key, value),
      })
    }
  }
  return markRaw(merged)
}

function isRuntimeParam(definition: DashboardParamLike): definition is DashboardRuntimeParam {
  return hasProperty(definition, 'codec')
}
