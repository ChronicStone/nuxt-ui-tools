/**
 * Vue composables for URL query state management.
 *
 * - useQueryState:   single param ↔ typed ref
 * - useQueryStates:  multiple params ↔ single reactive object, batched writes
 * - dynamicQueryState: factory for dynamic key sets (e.g. filters)
 *
 * All backed by QueryStateClient for cache + microtask batching.
 * Uses shallowRef internally to avoid deep reactive proxying.
 */

import { computed, onScopeDispose, shallowRef, type WritableComputedRef } from 'vue'
import { useRouter, type Router } from 'vue-router'

import type { GenericObject } from '#ui-tools/shared/types/utils'
import { hasProperty, isObject } from '#ui-tools/shared/utils/predicate'

import { QueryStateClient, type HistoryMode } from './client'
import type { QueryCodec } from './codecs'

// ---------------------------------------------------------------------------
// Client registry
// ---------------------------------------------------------------------------

const clientRegistry = new WeakMap<Router, QueryStateClient>()

/**
 * Pre-register a query-state client for a router instance.
 *
 * This is useful from app plugins when you want one shared client instance with
 * custom defaults or devtools wiring before composables run.
 *
 * @example
 * ```ts
 * const client = new QueryStateClient({ router, defaultHistoryMode: 'replace' })
 * registerQueryStateClient(router, client)
 * ```
 */
export function registerQueryStateClient(router: Router, client: QueryStateClient): void {
  clientRegistry.set(router, client)
}

/**
 * Returns the shared query-state client for the current router.
 *
 * If no client has been registered yet, this lazily creates one and wires route
 * synchronization so external navigations update active query-state consumers.
 *
 * @example
 * ```ts
 * const client = useQueryStateClient({ defaultHistoryMode: 'push' })
 * client.set('page', '2')
 * ```
 */
export function useQueryStateClient(options?: {
  /** History mode used by the lazily created client when individual writes omit one. */
  defaultHistoryMode?: HistoryMode
}): QueryStateClient {
  const router = useRouter()

  let client = clientRegistry.get(router)
  if (!client) {
    client = new QueryStateClient({
      router,
      defaultHistoryMode: options?.defaultHistoryMode,
    })
    clientRegistry.set(router, client)

    router.afterEach(() => {
      client!.syncFromRoute()
    })
  }

  return client
}

// ---------------------------------------------------------------------------
// useQueryState — single param
// ---------------------------------------------------------------------------

type ResolveDefaultedValue<TValue, TDefault> = undefined extends TDefault
  ? TValue
  : Exclude<TValue, undefined>

type UseQueryStateBaseOptions<TValue> = {
  /** Query-string key to read from and write to. */
  key: string
  /** Codec that maps between raw query values and the typed runtime value. */
  codec: QueryCodec<TValue>
  /** Remove the key when the serialized value matches `defaultValue`. Defaults to `true`. */
  omitDefault?: boolean
  /** Override the router history mode for writes from this state. */
  historyMode?: HistoryMode
}

/**
 * Options for a single typed query-state binding.
 *
 * When `defaultValue` excludes `undefined`, the returned ref is narrowed so
 * downstream code can treat missing or invalid query values as already resolved.
 */
export type UseQueryStateOptions<TValue, TDefault = TValue> = UseQueryStateBaseOptions<TValue> & {
  /** Fallback used when the key is missing or the codec returns `undefined`. */
  defaultValue: TDefault
}

export function useQueryState<TValue>(
  options: UseQueryStateBaseOptions<TValue> & { defaultValue: undefined },
): WritableComputedRef<TValue>
export function useQueryState<TValue, TDefault extends Exclude<TValue, undefined>>(
  options: UseQueryStateBaseOptions<TValue> & { defaultValue: TDefault },
): WritableComputedRef<Exclude<TValue, undefined>>
/**
 * Binds one query-string key to a writable computed ref.
 *
 * Reads come from the shared client cache, writes are pushed through the client
 * so multiple updates in the same tick can still batch at the router layer.
 * Use `useQueryStates(...)` instead when one feature owns multiple coordinated
 * query values.
 *
 * @example
 * ```ts
 * const layout = useQueryState({
 *   key: 'layout',
 *   codec: createEnumCodec(['grid', 'table']),
 *   defaultValue: 'grid',
 * })
 * ```
 */
export function useQueryState<TValue, TDefault extends TValue>(
  options: UseQueryStateOptions<TValue, TDefault>,
): WritableComputedRef<ResolveDefaultedValue<TValue, TDefault>> {
  const client = useQueryStateClient()
  const { key, codec, defaultValue, historyMode } = options
  const omitDefault = options.omitDefault ?? true

  const internal = shallowRef<ResolveDefaultedValue<TValue, TDefault>>(readFromClient())

  function readFromClient(): ResolveDefaultedValue<TValue, TDefault> {
    const raw = client.get(key)
    if (raw == null) {
      // SAFETY: a non-undefined default is narrowed by the overload contract.
      return defaultValue as ResolveDefaultedValue<TValue, TDefault>
    }

    const parsed = codec.parse(raw)
    // SAFETY: parsed and defaultValue are both TValue; the overload removes undefined when applicable.
    return (parsed === undefined ? defaultValue : parsed) as ResolveDefaultedValue<TValue, TDefault>
  }

  function writeToClient(value: ResolveDefaultedValue<TValue, TDefault>): void {
    const serialized = codec.serialize(value)
    const shouldOmit = omitDefault && serialized === codec.serialize(defaultValue)
    client.set(key, shouldOmit ? null : serialized, historyMode)
  }

  const unsubscribe = client.subscribe((changedKey, rawValue) => {
    if (changedKey !== key) return
    if (rawValue == null) {
      // SAFETY: a non-undefined default is narrowed by the overload contract.
      internal.value = defaultValue as ResolveDefaultedValue<TValue, TDefault>
      return
    }

    const parsed = codec.parse(rawValue)
    // SAFETY: parsed and defaultValue are both TValue; the overload removes undefined when applicable.
    internal.value = (parsed === undefined ? defaultValue : parsed) as ResolveDefaultedValue<
      TValue,
      TDefault
    >
  })

  onScopeDispose(unsubscribe)

  return computed({
    get: () => internal.value,
    set: (value) => {
      internal.value = value
      writeToClient(value)
    },
  })
}

// ---------------------------------------------------------------------------
// dynamicQueryState — factory for dynamic key sets
// ---------------------------------------------------------------------------

const DYNAMIC_MARKER = Symbol('dynamicQueryState')

/**
 * Configuration for a grouped query-state field whose URL keys are discovered at
 * runtime from a definition list.
 *
 * This is useful for abstractions like dynamic filters where the property shape
 * is stable for consumers, but the concrete query keys depend on runtime schema.
 */
export interface DynamicQueryStateOptions<TDefinition, TValue> {
  /** URL prefix for all keys this dynamic state owns, relative to the parent `prefix`. */
  urlPrefix: string
  /** Returns the current definitions that determine which query keys exist. */
  definitions: () => TDefinition[]
  /**
   * For one runtime definition, return every query key it may occupy together
   * with the codec that should parse and serialize that key.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolve: (definition: TDefinition) => Array<{ urlKey: string; codec: QueryCodec<any> }>
  /** Build the consumer-facing value from the parsed query entries and current definitions. */
  parse: (entries: ReadonlyMap<string, unknown>, definitions: TDefinition[]) => TValue
  /**
   * Map the consumer-facing value back into query entries.
   *
   * Use `null` values in the returned map to clear individual query keys.
   */
  serialize: (value: TValue, definitions: TDefinition[]) => Map<string, unknown>
  /** Value returned when no relevant query keys are currently present. */
  defaultValue: TValue
}

export interface DynamicQueryStateDef<TValue> {
  [DYNAMIC_MARKER]: true
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options: DynamicQueryStateOptions<any, TValue>
}

/**
 * Declares a dynamic grouped query-state field for use inside `useQueryStates(...)`.
 *
 * The returned marker object is schema metadata, not reactive state by itself.
 *
 * @example
 * ```ts
 * const filters = dynamicQueryState({
 *   urlPrefix: 'filters',
 *   definitions: () => filterDefinitions.value,
 *   resolve: (definition) => [{ urlKey: definition.key, codec: stringCodec }],
 *   parse: (entries) => Array.from(entries.entries()),
 *   serialize: (value) => new Map(value),
 *   defaultValue: [],
 * })
 * ```
 */
export function dynamicQueryState<TDefinition, TValue>(
  options: DynamicQueryStateOptions<TDefinition, TValue>,
): DynamicQueryStateDef<TValue> {
  return {
    [DYNAMIC_MARKER]: true,
    options,
  }
}

type QueryStateValue = GenericObject[string]

function isDynamicDef(
  value: QueryStatesSchemaEntry,
): value is DynamicQueryStateDef<QueryStateValue> {
  return isObject(value) && hasProperty(value, DYNAMIC_MARKER)
}

// ---------------------------------------------------------------------------
// useQueryStates — multiple params, batched
// ---------------------------------------------------------------------------

/**
 * Static query-state definition used inside `useQueryStates(...)`.
 *
 * Each property maps one state field to one query-string key.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface StaticQueryStateOptions<TValue = any, TDefault = TValue> {
  /** Codec used to parse the raw query value and serialize writes back to the URL. */
  codec: QueryCodec<TValue>
  /** Fallback used when the query key is missing or the codec returns `undefined`. */
  defaultValue: TDefault
  /** Override the URL key for this property. Defaults to the property name. */
  urlKey?: string
  /** Remove the key when the serialized value matches `defaultValue`. Defaults to `true`. */
  omitDefault?: boolean
  /** Override the history mode for this property when `useQueryStates(...)` writes. */
  historyMode?: HistoryMode
}

/**
 * One schema entry accepted by `useQueryStates(...)`.
 *
 * Use a static entry for one-to-one property mappings, or `dynamicQueryState(...)`
 * when one property owns a runtime-defined set of query keys.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type QueryStatesSchemaEntry<TValue = any, TDefault = TValue> =
  | StaticQueryStateOptions<TValue, TDefault>
  | DynamicQueryStateDef<TValue>

/**
 * Schema accepted by `useQueryStates(...)`.
 *
 * Each object key becomes a property on the returned writable computed state.
 */
export type QueryStatesSchema = Record<string, QueryStatesSchemaEntry>

type InferEntryValue<E> =
  E extends DynamicQueryStateDef<infer TValue>
    ? TValue
    : E extends StaticQueryStateOptions<infer TValue, infer TDefault>
      ? ResolveDefaultedValue<TValue, TDefault>
      : never

type QueryStatesValues<T extends QueryStatesSchema> = {
  [K in keyof T]: InferEntryValue<T[K]>
}

function resolveQueryStatesValues<T extends QueryStatesSchema>(
  values: GenericObject,
): QueryStatesValues<T> {
  // SAFETY: callers populate `values` from the same schema's complete static and dynamic key lists.
  return values as QueryStatesValues<T>
}

export interface UseQueryStatesOptions<T extends QueryStatesSchema> {
  /** Optional prefix prepended to every static and dynamic query key in this schema. */
  prefix?: string
  /** Schema describing the typed grouped state and how each property maps to the URL. */
  schema: T
  /** Default history mode used when the grouped state writes to the router. */
  historyMode?: HistoryMode
}

/**
 * Binds a schema of query-string keys to one writable computed object.
 *
 * Static entries map one property to one query key. Dynamic entries let one
 * property own a runtime-discovered set of query keys while still participating
 * in the same batched read/write flow.
 *
 * @example
 * ```ts
 * const pagination = useQueryStates({
 *   prefix: 'users',
 *   schema: {
 *     page: { codec: numberCodec, defaultValue: 1 },
 *     pageSize: { codec: numberCodec, defaultValue: 20, urlKey: 'size' },
 *   },
 * })
 * ```
 */
export function useQueryStates<T extends QueryStatesSchema>(
  options: UseQueryStatesOptions<T>,
): WritableComputedRef<QueryStatesValues<T>> {
  const client = useQueryStateClient()
  const { schema, historyMode, prefix } = options

  // SAFETY: Object.keys returns every runtime key of the schema object.
  const keys = Object.keys(schema) as Array<keyof T & string>
  const staticKeys: string[] = []
  const dynamicKeys: string[] = []

  // Classify keys and precompute URL key mappings for static entries
  const staticUrlKeys = new Map<string, string>() // propertyName → full URL key

  for (const k of keys) {
    const entry = schema[k]!
    if (isDynamicDef(entry)) {
      dynamicKeys.push(k)
    } else {
      staticKeys.push(k)
      // SAFETY: isDynamicDef excluded the dynamic schema variant above.
      const def = entry as StaticQueryStateOptions
      const urlSegment = def.urlKey ?? k
      staticUrlKeys.set(k, prefix ? `${prefix}.${urlSegment}` : urlSegment)
    }
  }

  // Internal store — shallowRef to avoid deep proxying
  const internal = shallowRef<QueryStatesValues<T>>(readAll())

  // --- Static field helpers ---

  function readStatic(propKey: string): QueryStateValue {
    // SAFETY: propKey comes from the schema key lists built above.
    const def = schema[propKey] as StaticQueryStateOptions
    const urlKey = staticUrlKeys.get(propKey)!
    const raw = client.get(urlKey)
    if (raw == null) return def.defaultValue
    const parsed = def.codec.parse(raw)
    return parsed === undefined ? def.defaultValue : parsed
  }

  // --- Dynamic field helpers ---

  function readDynamic(propKey: string): QueryStateValue {
    // SAFETY: propKey comes from the dynamic schema key list built above.
    const dynDef = (schema[propKey] as DynamicQueryStateDef<unknown>).options
    const definitions = dynDef.definitions()
    if (!definitions.length) return dynDef.defaultValue

    const fullPrefix = prefix ? `${prefix}.${dynDef.urlPrefix}` : dynDef.urlPrefix
    const entries = new Map<string, unknown>()

    for (const def of definitions) {
      const resolvedKeys = dynDef.resolve(def)
      for (const { urlKey, codec } of resolvedKeys) {
        const fullKey = `${fullPrefix}.${urlKey}`
        const raw = client.get(fullKey)
        if (raw != null && raw !== '') {
          entries.set(urlKey, codec.parse(raw))
        }
      }
    }

    if (entries.size === 0) return dynDef.defaultValue
    return dynDef.parse(entries, definitions)
  }

  function writeDynamic(
    propKey: string,
    value: QueryStateValue,
  ): Array<{ key: string; value: string | null }> {
    // SAFETY: propKey comes from the dynamic schema key list built above.
    const dynDef = (schema[propKey] as DynamicQueryStateDef<unknown>).options
    const definitions = dynDef.definitions()
    const fullPrefix = prefix ? `${prefix}.${dynDef.urlPrefix}` : dynDef.urlPrefix

    const updates: Array<{ key: string; value: string | null }> = []

    // Clear all known keys for this dynamic field
    for (const def of definitions) {
      const resolvedKeys = dynDef.resolve(def)
      for (const { urlKey } of resolvedKeys) {
        updates.push({ key: `${fullPrefix}.${urlKey}`, value: null })
      }
    }

    // Set active values
    const serialized = dynDef.serialize(value, definitions)
    for (const [urlKey, val] of serialized) {
      const fullKey = `${fullPrefix}.${urlKey}`
      // Find the codec for this urlKey
      let codec: QueryCodec<unknown> | undefined
      for (const def of definitions) {
        const resolved = dynDef.resolve(def)
        const match = resolved.find((r) => r.urlKey === urlKey)
        if (match) {
          codec = match.codec
          break
        }
      }

      if (codec && val != null) {
        const existing = updates.findIndex((u) => u.key === fullKey)
        const serializedValue = codec.serialize(val)
        if (existing >= 0) {
          updates[existing]!.value = serializedValue
        } else {
          updates.push({ key: fullKey, value: serializedValue })
        }
      }
    }

    return updates
  }

  // --- Read/write all ---

  function readAll(): QueryStatesValues<T> {
    const result: GenericObject = {}
    for (const k of staticKeys) result[k] = readStatic(k)
    for (const k of dynamicKeys) result[k] = readDynamic(k)
    return resolveQueryStatesValues<T>(result)
  }

  function writeAll(values: QueryStatesValues<T>): void {
    const updates: Array<{ key: string; value: string | null }> = []

    for (const k of staticKeys) {
      // SAFETY: staticKeys contains only entries rejected by isDynamicDef.
      const def = schema[k] as StaticQueryStateOptions
      const urlKey = staticUrlKeys.get(k)!
      // SAFETY: k is a runtime key from the schema and values mirrors that schema.
      const value = (values as GenericObject)[k]
      const serialized = def.codec.serialize(value)
      const omit = (def.omitDefault ?? true) && serialized === def.codec.serialize(def.defaultValue)
      updates.push({ key: urlKey, value: omit ? null : serialized })
    }

    for (const k of dynamicKeys) {
      // SAFETY: k is a runtime key from the dynamic schema and values mirrors that schema.
      const dynUpdates = writeDynamic(k, (values as GenericObject)[k])
      updates.push(...dynUpdates)
    }

    client.setBatch(updates, historyMode)
  }

  // --- Subscribe to external changes ---

  // Collect all URL keys we care about for fast filtering
  const allStaticUrlKeyValues = new Set(staticUrlKeys.values())

  const unsubscribe = client.subscribe((changedKey) => {
    // Check static keys
    if (allStaticUrlKeyValues.has(changedKey)) {
      internal.value = readAll()
      return
    }

    // Check dynamic key prefixes
    for (const k of dynamicKeys) {
      // SAFETY: k comes from dynamicKeys, which is populated only by isDynamicDef.
      const dynDef = (schema[k] as DynamicQueryStateDef<unknown>).options
      const fullPrefix = prefix ? `${prefix}.${dynDef.urlPrefix}` : dynDef.urlPrefix
      if (changedKey.startsWith(fullPrefix + '.')) {
        internal.value = readAll()
        return
      }
    }
  })

  onScopeDispose(unsubscribe)

  return computed({
    get: () => internal.value,
    set: (value: QueryStatesValues<T>) => {
      internal.value = value
      writeAll(value)
    },
  })
}
