import { hashKey, useQueryClient } from '@tanstack/vue-query'
import type { QueryClient } from '@tanstack/vue-query'
import { getCurrentScope, onScopeDispose, shallowRef, toValue } from 'vue'
import type { ShallowRef } from 'vue'

import {
  isAsyncResource,
  isRuntimeQueryOptions,
  resolveOptionKeys,
  resolveRemoteOptionConfig,
  resolveTrackedOptionSource,
} from '../../../composables/use-field-options'
import type { FormField, FormFieldCallbackParams } from '../../../types'
import { normalizeOptionItems } from '../../../utils/options'
import type { ResolvedFormOption } from '../../../utils/options'
import { isRecord } from '../../../utils/path'
import { isFunction, isPromise, isUndefined } from '../../../utils/predicate'

/** Options an inert select shows, and whether the live select would show a loading state. */
export interface InertOptionState {
  items: readonly ResolvedFormOption[]
  loading: boolean
}

/**
 * Resolves the options of inert select cells without an options query per cell: a query source
 * reads the shared query cache, which one subscription watches for the whole table, and the first
 * cell that finds no data fetches it once. Remote sources and sources that return a promise have
 * no synchronous options, so their cells render live.
 *
 * Cells re-render when the state of their query changes, not when an observer comes or goes, which
 * a row does as it renders its live selects. A query the cache drops is fetched again by the next
 * cell that needs it.
 */
export function createInertOptions() {
  const queryClient = resolveQueryClient()
  const versions = new Map<string, ShallowRef<number>>()
  const requested = new Set<string>()
  const liveColumns = new WeakSet<FormField>()
  const unsubscribe = queryClient?.getQueryCache().subscribe((event) => {
    if (event.type !== 'updated' && event.type !== 'removed') {
      return
    }
    const hash = event.query.queryHash
    if (event.type === 'removed') {
      requested.delete(hash)
    }
    const version = versions.get(hash)
    if (version) {
      version.value += 1
    }
  })
  if (getCurrentScope()) {
    onScopeDispose(() => unsubscribe?.())
  }

  function resolve(
    field: FormField,
    params: FormFieldCallbackParams,
  ): InertOptionState | undefined {
    if (liveColumns.has(field) || resolveRemoteOptionConfig(field)) {
      return
    }
    const tracked = resolveTrackedOptionSource(field, params)
    const keys = resolveOptionKeys(field)
    const contextPending = tracked.contextKeys.some((key) => {
      const resource = isRecord(params.ctx)
        ? Object.getOwnPropertyDescriptor(params.ctx, key)?.value
        : undefined
      return isAsyncResource(resource) && resource.pending && isUndefined(resource.value)
    })
    const source = tracked.source
    if (Array.isArray(source)) {
      return {
        items: normalizeOptionItems(source, keys),
        loading: contextPending && !source.length,
      }
    }
    if (isPromise(source)) {
      liveColumns.add(field)
      return
    }
    if (!isRuntimeQueryOptions(source)) {
      return { items: [], loading: contextPending }
    }
    if (!queryClient) {
      return
    }
    const hash = hashKey(source.queryKey)
    track(hash)
    const state = queryClient.getQueryState(source.queryKey)
    if (state?.data === undefined) {
      if (toValue(source.enabled) !== false && !requested.has(hash)) {
        requested.add(hash)
        void queryClient.prefetchQuery(source)
      }
      return { items: [], loading: true }
    }
    const selected = isFunction(source.select) ? source.select(state.data) : state.data
    return {
      items: normalizeOptionItems(Array.isArray(selected) ? selected : [], keys),
      loading: state.fetchStatus === 'fetching',
    }
  }

  function track(hash: string) {
    let version = versions.get(hash)
    if (!version) {
      version = shallowRef<number>(0)
      versions.set(hash, version)
    }
    void version.value
  }

  return { resolve }
}

export type InertOptions = ReturnType<typeof createInertOptions>

function resolveQueryClient(): QueryClient | null {
  try {
    return useQueryClient()
  } catch {
    return null
  }
}
