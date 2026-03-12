import { useQuery } from '@tanstack/vue-query'
import { watchEffect } from 'vue'
import type { Ref, ShallowRef } from 'vue'
import type { GenericObject, TableContextItem, TablePageContextItem } from '../types'

type ContextLoadingRefs = {
  isLoadingContext: Ref<boolean>
  errorContext: Ref<Error | null>
}

/**
 * Loads all context items via TanStack Query.
 *
 * Each item gets its own `useQuery` call, giving it independent:
 *   - Caching (queryKey per item)
 *   - Background refetching
 *   - Stale-while-revalidate
 *
 * Items with `views` or `condition` are enabled/disabled reactively via
 * TanStack Query's `enabled` option — no manual filtering needed.
 *
 * `isLoadingContext` is true while ANY item's initial load is pending.
 * Once all items have resolved at least once, the source engine unblocks.
 */
export function useTableContext<TContext extends GenericObject = GenericObject>(
  contextItems: readonly TableContextItem[],
  contextRef: ShallowRef<TContext>,
  loadingRefs: ContextLoadingRefs,
  activeView: Ref<string | undefined>,
): {
  refresh: () => void
} {
  if (!contextItems.length) {
    return { refresh: () => {} }
  }

  // One useQuery per context item — independent caching and lifecycle
  const queries = contextItems.map(item =>
    useQuery(() => ({
      ...item.query(),
      // Disable if item is scoped to views that aren't currently active
      enabled: isItemEnabled(item, activeView.value),
    })),
  )

  // Merge all resolved data into the context ref
  watchEffect(() => {
    const patch: Record<string, unknown> = {}
    for (let i = 0; i < contextItems.length; i++) {
      const value = queries[i].data.value
      if (value !== undefined) {
        patch[contextItems[i].key] = value
      }
    }
    if (Object.keys(patch).length > 0) {
      contextRef.value = { ...contextRef.value, ...patch } as TContext
    }
  })

  // isLoadingContext = any enabled item is in initial loading state
  watchEffect(() => {
    loadingRefs.isLoadingContext.value = queries.some(
      (q, i) => isItemEnabled(contextItems[i], activeView.value) && q.isLoading.value,
    )
  })

  // Surface first error
  watchEffect(() => {
    const failing = queries.find((q, i) => isItemEnabled(contextItems[i], activeView.value) && q.error.value)
    loadingRefs.errorContext.value = (failing?.error.value as Error | null) ?? null
  })

  function refresh(): void {
    for (const q of queries) q.refetch()
  }

  return { refresh }
}

/**
 * Loads page context items — called after each source fetch, receives current rows.
 *
 * Page context is separate from context: it runs AFTER rows are fetched and
 * receives the current page rows as input. Used for per-row secondary lookups.
 *
 * Note: page context items have `query(ctx)` that receives `{ rows, context }`.
 * The queryKey should include something stable about the current page (e.g., row IDs)
 * to ensure correct caching and invalidation.
 *
 * This function sets up reactive `useQuery` calls inside the source engine lifecycle.
 */
export function useTablePageContext<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
>(
  pageContextItems: readonly TablePageContextItem<TRow, TContext>[],
  metaRefs: {
    rows: ShallowRef<readonly TRow[]>
    context: ShallowRef<TContext>
    pageContext: ShallowRef<TPageContext>
    isLoadingData: Ref<boolean>
    isLoadingPageContext: Ref<boolean>
    errorPageContext: Ref<Error | null>
  },
  activeView: Ref<string | undefined>,
): void {
  if (!pageContextItems.length) return

  // One useQuery per page context item — reactive on current rows + context
  const queries = pageContextItems.map(item =>
    useQuery(() => ({
      ...item.query({ rows: metaRefs.rows.value, context: metaRefs.context.value }),
      // Disabled while source data is loading — wait for rows to be ready
      enabled: !metaRefs.isLoadingData.value && isItemEnabled(item, activeView.value),
    })),
  )

  // Merge into pageContext ref
  watchEffect(() => {
    const patch: Record<string, unknown> = {}
    for (let i = 0; i < pageContextItems.length; i++) {
      const value = queries[i].data.value
      if (value !== undefined) {
        patch[pageContextItems[i].key] = value
      }
    }
    if (Object.keys(patch).length > 0) {
      metaRefs.pageContext.value = { ...metaRefs.pageContext.value, ...patch } as TPageContext
    }
  })

  watchEffect(() => {
    metaRefs.isLoadingPageContext.value = queries.some(
      (q, i) => isItemEnabled(pageContextItems[i], activeView.value) && q.isLoading.value,
    )
  })

  watchEffect(() => {
    const failing = queries.find((q, i) => isItemEnabled(pageContextItems[i], activeView.value) && q.error.value)
    metaRefs.errorPageContext.value = (failing?.error.value as Error | null) ?? null
  })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isItemEnabled(
  item: { views?: readonly string[], condition?: unknown },
  activeView: string | undefined,
): boolean {
  if (item.views?.length) {
    if (!activeView || !item.views.includes(activeView)) return false
  }
  if (item.condition !== undefined) {
    const cond = typeof item.condition === 'function' ? item.condition() : item.condition
    if (cond === false) return false
  }
  return true
}
