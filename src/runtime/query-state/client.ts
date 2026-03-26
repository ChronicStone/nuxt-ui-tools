/**
 * QueryStateClient — the central coordinator for URL query state.
 *
 * Inspired by nuqs's QueryClient:
 * - Maintains an in-memory cache of parsed query values
 * - Batches multiple mutations within the same microtask into a single router push/replace
 * - Supports multiple independent query state consumers without interference
 * - Pluggable router adapter (vue-router, custom, or manual)
 */
import type { Router, LocationQuery } from 'vue-router'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type HistoryMode = 'push' | 'replace'

/**
 * Creates a query-state client bound to a router instance.
 *
 * A single client should usually be shared per router so multiple query-state
 * consumers can coordinate batched writes and route-sync behavior.
 */
export interface QueryStateClientOptions {
  /** Router instance whose current route and navigation methods back this client. */
  router: Router
  /** History mode used when callers do not provide one for a write. */
  defaultHistoryMode?: HistoryMode
}

type PendingUpdate = {
  key: string
  value: string | null // null = remove from URL
  historyMode: HistoryMode
}

type Subscriber = (key: string, value: string | null) => void

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export class QueryStateClient {
  private router: Router
  private defaultHistoryMode: HistoryMode
  private cache = new Map<string, string | null>()
  private subscribers = new Set<Subscriber>()

  // Batching
  private pendingUpdates: PendingUpdate[] = []
  private flushScheduled = false

  // Devtools
  private _devtoolsListeners = new Set<() => void>()
  private _mutationLog: Array<{
    timestamp: number
    key: string
    value: string | null
    historyMode: HistoryMode
  }> = []

  /** Create a query-state client backed by the provided router. */
  constructor(options: QueryStateClientOptions) {
    this.router = options.router
    this.defaultHistoryMode = options.defaultHistoryMode ?? 'replace'
  }

  // ---------------------------------------------------------------------------
  // Read
  // ---------------------------------------------------------------------------

  /** Read a raw query value. Cache-first, falls back to current route. */
  get(key: string): string | null {
    if (this.cache.has(key)) {
      return this.cache.get(key) ?? null
    }

    const raw = this.readFromRoute(key)
    this.cache.set(key, raw)
    return raw
  }

  /** Read directly from the current route query. */
  private readFromRoute(key: string): string | null {
    const value = this.router.currentRoute.value.query[key]
    if (value == null) return null
    return Array.isArray(value) ? (value[0] as string | null) : (value as string)
  }

  // ---------------------------------------------------------------------------
  // Write (batched)
  // ---------------------------------------------------------------------------

  /** Queue a single param update. Flushed at the end of the microtask. */
  set(key: string, value: string | null, historyMode?: HistoryMode): void {
    // Update cache immediately so subsequent reads within the same tick are consistent
    this.cache.set(key, value)

    const mode = historyMode ?? this.defaultHistoryMode

    this.pendingUpdates.push({ key, value, historyMode: mode })
    this._mutationLog.push({ timestamp: Date.now(), key, value, historyMode: mode })

    this.scheduleFlush()

    // Notify in-memory subscribers synchronously so Vue refs update immediately
    for (const subscriber of this.subscribers) {
      subscriber(key, value)
    }

    this.notifyDevtools()
  }

  /** Queue multiple param updates as a single batch. */
  setBatch(updates: Array<{ key: string; value: string | null }>, historyMode?: HistoryMode): void {
    const mode = historyMode ?? this.defaultHistoryMode

    const now = Date.now()
    for (const update of updates) {
      this.cache.set(update.key, update.value)
      this.pendingUpdates.push({ key: update.key, value: update.value, historyMode: mode })
      this._mutationLog.push({
        timestamp: now,
        key: update.key,
        value: update.value,
        historyMode: mode,
      })
    }

    this.scheduleFlush()

    for (const update of updates) {
      for (const subscriber of this.subscribers) {
        subscriber(update.key, update.value)
      }
    }

    this.notifyDevtools()
  }

  // ---------------------------------------------------------------------------
  // Flush
  // ---------------------------------------------------------------------------

  private scheduleFlush(): void {
    if (this.flushScheduled) return
    this.flushScheduled = true

    // Use queueMicrotask for maximum batching within a single tick
    queueMicrotask(() => this.flush())
  }

  private flush(): void {
    this.flushScheduled = false

    if (!this.pendingUpdates.length) return

    const updates = this.pendingUpdates
    this.pendingUpdates = []

    // Determine history mode: if ANY update requests 'push', use push
    const usePush = updates.some((u) => u.historyMode === 'push')

    // Build the next query object from the current route
    const currentQuery = { ...this.router.currentRoute.value.query }
    const nextQuery: LocationQuery = { ...currentQuery }

    for (const { key, value } of updates) {
      if (value == null) {
        delete nextQuery[key]
      } else {
        nextQuery[key] = value
      }
    }

    // Only navigate if something actually changed
    if (queryEquals(currentQuery, nextQuery)) return

    const navigate = usePush
      ? this.router.push.bind(this.router)
      : this.router.replace.bind(this.router)

    navigate({ query: nextQuery })
  }

  // ---------------------------------------------------------------------------
  // Subscribe — for reactive refs to listen to external route changes
  // ---------------------------------------------------------------------------

  subscribe(fn: Subscriber): () => void {
    this.subscribers.add(fn)
    return () => {
      this.subscribers.delete(fn)
    }
  }

  // ---------------------------------------------------------------------------
  // Sync from route — call this on route changes to invalidate stale cache
  // ---------------------------------------------------------------------------

  syncFromRoute(): void {
    const query = this.router.currentRoute.value.query

    // Invalidate cache entries that differ from the route
    for (const [key, cached] of this.cache) {
      const routeValue = query[key]
      const rawRoute =
        routeValue == null
          ? null
          : Array.isArray(routeValue)
            ? (routeValue[0] as string | null)
            : (routeValue as string)

      if (rawRoute !== cached) {
        this.cache.set(key, rawRoute)

        // Notify subscribers of external change
        for (const subscriber of this.subscribers) {
          subscriber(key, rawRoute)
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Reset
  // ---------------------------------------------------------------------------

  /** Clear the cache and all pending updates. */
  clear(): void {
    this.cache.clear()
    this.pendingUpdates = []
  }

  // ---------------------------------------------------------------------------
  // Devtools
  // ---------------------------------------------------------------------------

  /** Subscribe to state changes for devtools. Returns unsubscribe fn. */
  onDevtoolsUpdate(fn: () => void): () => void {
    this._devtoolsListeners.add(fn)
    return () => {
      this._devtoolsListeners.delete(fn)
    }
  }

  private notifyDevtools(): void {
    for (const fn of this._devtoolsListeners) fn()
  }

  /** Snapshot of all internal state for devtools inspection. */
  __devtools__() {
    return {
      cache: Object.fromEntries(this.cache),
      pendingUpdates: [...this.pendingUpdates],
      subscriberCount: this.subscribers.size,
      mutationLog: this._mutationLog.slice(-50), // keep last 50
      routeQuery: { ...this.router.currentRoute.value.query },
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function queryEquals(a: LocationQuery, b: LocationQuery): boolean {
  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)

  if (aKeys.length !== bKeys.length) return false

  for (const key of aKeys) {
    if (a[key] !== b[key]) return false
  }

  return true
}
