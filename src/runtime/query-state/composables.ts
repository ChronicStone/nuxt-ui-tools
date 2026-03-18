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
import { useRouter } from 'vue-router'

import { QueryStateClient, type HistoryMode } from './client'
import type { QueryCodec } from './codecs'

// ---------------------------------------------------------------------------
// Client registry
// ---------------------------------------------------------------------------

const clientRegistry = new WeakMap<object, QueryStateClient>()

/** Pre-register a client for a router instance (use from plugins). */
export function registerQueryStateClient(router: object, client: QueryStateClient): void {
  clientRegistry.set(router, client)
}

/** Get or create a QueryStateClient for the current router. */
export function useQueryStateClient(options?: {
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

export interface UseQueryStateOptions<T> {
  key: string
  codec: QueryCodec<T>
  defaultValue: T
  omitDefault?: boolean
  historyMode?: HistoryMode
}

export function useQueryState<T>(options: UseQueryStateOptions<T>): WritableComputedRef<T> {
  const client = useQueryStateClient()
  const { key, codec, defaultValue, historyMode } = options
  const omitDefault = options.omitDefault ?? true

  const internal = shallowRef<T>(readFromClient())

  function readFromClient(): T {
    const raw = client.get(key)
    if (raw == null) return defaultValue
    return codec.parse(raw)
  }

  function writeToClient(value: T): void {
    const serialized = codec.serialize(value)
    const shouldOmit = omitDefault && serialized === codec.serialize(defaultValue)
    client.set(key, shouldOmit ? null : serialized, historyMode)
  }

  const unsubscribe = client.subscribe((changedKey, rawValue) => {
    if (changedKey !== key) return
    internal.value = rawValue == null ? defaultValue : codec.parse(rawValue)
  })

  onScopeDispose(unsubscribe)

  return computed({
    get: () => internal.value,
    set: (value: T) => {
      internal.value = value
      writeToClient(value)
    },
  })
}

// ---------------------------------------------------------------------------
// dynamicQueryState — factory for dynamic key sets
// ---------------------------------------------------------------------------

const DYNAMIC_MARKER = Symbol('dynamicQueryState')

export interface DynamicQueryStateOptions<TDefinition, TValue> {
  /** URL prefix for all keys this dynamic state owns (relative to parent prefix). */
  urlPrefix: string
  /** Returns current definitions that drive which URL keys exist. */
  definitions: () => TDefinition[]
  /** For a given definition, return all URL keys it could occupy + codec for each. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolve: (definition: TDefinition) => Array<{ urlKey: string; codec: QueryCodec<any> }>
  /** Transform parsed URL entries into the final value. */
  parse: (entries: ReadonlyMap<string, unknown>, definitions: TDefinition[]) => TValue
  /** Transform value back into URL entries. null values = remove from URL. */
  serialize: (value: TValue, definitions: TDefinition[]) => Map<string, unknown>
  /** Default when no URL keys are present. */
  defaultValue: TValue
}

export interface DynamicQueryStateDef<TValue> {
  [DYNAMIC_MARKER]: true
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _options: DynamicQueryStateOptions<any, TValue>
}

export function dynamicQueryState<TDefinition, TValue>(
  options: DynamicQueryStateOptions<TDefinition, TValue>,
): DynamicQueryStateDef<TValue> {
  return {
    [DYNAMIC_MARKER]: true,
    _options: options,
  }
}

function isDynamicDef(value: unknown): value is DynamicQueryStateDef<unknown> {
  return value != null && typeof value === 'object' && DYNAMIC_MARKER in value
}

// ---------------------------------------------------------------------------
// useQueryStates — multiple params, batched
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface StaticParamDef<T = any> {
  codec: QueryCodec<T>
  defaultValue: T
  urlKey?: string
  omitDefault?: boolean
  historyMode?: HistoryMode
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SchemaEntry<T = any> = StaticParamDef<T> | DynamicQueryStateDef<T>

type QueryStatesSchema = Record<string, SchemaEntry>

type InferEntryValue<E> =
  E extends DynamicQueryStateDef<infer V> ? V : E extends StaticParamDef<infer V> ? V : never

type QueryStatesValues<T extends QueryStatesSchema> = {
  [K in keyof T]: InferEntryValue<T[K]>
}

export interface UseQueryStatesOptions<T extends QueryStatesSchema> {
  prefix?: string
  schema: T
  historyMode?: HistoryMode
}

export function useQueryStates<T extends QueryStatesSchema>(
  options: UseQueryStatesOptions<T>,
): WritableComputedRef<QueryStatesValues<T>> {
  const client = useQueryStateClient()
  const { schema, historyMode, prefix } = options

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
      const def = entry as StaticParamDef
      const urlSegment = def.urlKey ?? k
      staticUrlKeys.set(k, prefix ? `${prefix}.${urlSegment}` : urlSegment)
    }
  }

  // Internal store — shallowRef to avoid deep proxying
  const internal = shallowRef<QueryStatesValues<T>>(readAll())

  // --- Static field helpers ---

  function readStatic(propKey: string): unknown {
    const def = schema[propKey] as StaticParamDef
    const urlKey = staticUrlKeys.get(propKey)!
    const raw = client.get(urlKey)
    if (raw == null) return def.defaultValue
    return def.codec.parse(raw)
  }

  // --- Dynamic field helpers ---

  function readDynamic(propKey: string): unknown {
    const dynDef = (schema[propKey] as DynamicQueryStateDef<unknown>)._options
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
    value: unknown,
  ): Array<{ key: string; value: string | null }> {
    const dynDef = (schema[propKey] as DynamicQueryStateDef<unknown>)._options
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
    const result = {} as Record<string, unknown>
    for (const k of staticKeys) result[k] = readStatic(k)
    for (const k of dynamicKeys) result[k] = readDynamic(k)
    return result as QueryStatesValues<T>
  }

  function writeAll(values: QueryStatesValues<T>): void {
    const updates: Array<{ key: string; value: string | null }> = []

    for (const k of staticKeys) {
      const def = schema[k] as StaticParamDef
      const urlKey = staticUrlKeys.get(k)!
      const value = (values as Record<string, unknown>)[k]
      const serialized = def.codec.serialize(value)
      const omit = (def.omitDefault ?? true) && serialized === def.codec.serialize(def.defaultValue)
      updates.push({ key: urlKey, value: omit ? null : serialized })
    }

    for (const k of dynamicKeys) {
      const dynUpdates = writeDynamic(k, (values as Record<string, unknown>)[k])
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
      const dynDef = (schema[k] as DynamicQueryStateDef<unknown>)._options
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
