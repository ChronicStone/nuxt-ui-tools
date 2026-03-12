import { queryOptions, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/vue-query'
import { watch } from 'vue'

import type { GenericObject, TableSchema } from '../types'
import type { TableSourceExecutionResult, TableSourceRequestContext } from '../types/source'
import type { TableStateRefs, TableMetaRefs } from './use-table-state'

/**
 * Source execution engine — built entirely on TanStack Query.
 *
 * Passes a **function** to `useQuery(() => queryOptions)` — the reactive pattern
 * for @tanstack/vue-query. The function is re-evaluated whenever its reactive
 * dependencies (state refs) change, making the queryKey reactive automatically.
 *
 * TanStack Query handles:
 *   - Caching and deduplication by queryKey
 *   - Background refetching (staleTime, gcTime from user's query definition)
 *   - Retry on error
 *
 * Context guard: `enabled: false` while context is loading so the source
 * waits for all context items to resolve before executing.
 *
 * Page reset: filter/search/sort/view changes reset page to 1 before the
 * new queryKey is built, ensuring consistent pagination.
 */
export function useTableSource<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TPageContext extends GenericObject = GenericObject,
>(
  schema: TableSchema,
  stateRefs: TableStateRefs,
  metaRefs: TableMetaRefs<TRow, TContext, TPageContext>,
): {
  refresh: () => Promise<void>
} {
  const queryClient = useQueryClient()

  // -------------------------------------------------------------------------
  // Page reset — filter/search/sort/view changes → page 1
  // -------------------------------------------------------------------------

  watch(
    () => ({
      search: stateRefs.search.value,
      filters: JSON.stringify(stateRefs.filters.value),
      sorting: JSON.stringify(stateRefs.sorting.value),
      view: stateRefs.activeView.value,
    }),
    () => {
      stateRefs.pagination.value = { ...stateRefs.pagination.value, page: 1 }
    },
  )

  // -------------------------------------------------------------------------
  // TanStack Query — reactive via function form
  //
  // useQuery(() => opts) re-evaluates the function whenever reactive state
  // accessed inside it changes. This is the recommended reactive pattern.
  // -------------------------------------------------------------------------

  const { data, isLoading, isFetching, isPending, error,  } = useQuery(
    () =>
      ({
        // User-defined queryKey and queryFn — all TanStack Query options supported
        ...schema.source.query({
          pagination: { ...stateRefs.pagination.value },
          sorting: [...stateRefs.sorting.value],
          filters: { ...stateRefs.filters.value },
          search: stateRefs.search.value,
          context: metaRefs.context.value,
        } satisfies TableSourceRequestContext),
        // Guard: wait for context to finish loading
        enabled: !metaRefs.isLoadingContext.value,
      }) as UseQueryOptions<any>,
  )

  watch(
    () => isLoading.value,
    (loading) => {
      console.log('Source loading state changed:', loading)
    },
    { immediate: true },
  )

  watch(
    () => data.value,
    (newData) => {
      console.log('Source data updated:', newData)
    },
    { immediate: true },
  )

  // -------------------------------------------------------------------------
  // Sync TanStack Query results → metaRefs
  // -------------------------------------------------------------------------

  watch(
    data,
    (result) => {
      if (result == null) return
      const { rows, rowCount } = normalizeResult(
        result,
        schema.source.mode,
        (schema.source as any).serializer,
      )
      metaRefs.rows.value = rows as TRow[]
      metaRefs.rowCount.value = rowCount
      metaRefs.pageCount.value = Math.max(
        1,
        Math.ceil(rowCount / stateRefs.pagination.value.pageSize),
      )
    },
    { immediate: true },
  )

  watch(isFetching, (fetching) => {
    metaRefs.isLoadingData.value = fetching
  })

  watch(error, (err) => {
    metaRefs.errorData.value = err
  })

  // -------------------------------------------------------------------------
  // Refresh — invalidates the current query key, TanStack Query refetches
  // -------------------------------------------------------------------------

  async function refresh(): Promise<void> {
    const ctx: TableSourceRequestContext = {
      pagination: { ...stateRefs.pagination.value },
      sorting: [...stateRefs.sorting.value],
      filters: { ...stateRefs.filters.value },
      search: stateRefs.search.value,
      context: metaRefs.context.value,
    }
    await queryClient.invalidateQueries({
      queryKey: schema.source.query(ctx).queryKey as unknown[],
    })
  }

  return { refresh }
}

// ---------------------------------------------------------------------------
// Internal: response normalization
// ---------------------------------------------------------------------------

function normalizeResult(
  raw: unknown,
  mode: string,
  serializer?: unknown,
): TableSourceExecutionResult {
  if (mode === 'remote') {
    if (serializer && typeof serializer === 'object' && 'fromResponse' in serializer) {
      const fn = (serializer as any).fromResponse
      if (typeof fn === 'function') return fn(raw) as TableSourceExecutionResult
    }
    if (raw && typeof raw === 'object' && 'rows' in raw && 'rowCount' in raw) {
      return raw as TableSourceExecutionResult
    }
    return { rows: [], rowCount: 0 }
  }

  if (Array.isArray(raw)) {
    return { rows: raw as GenericObject[], rowCount: raw.length }
  }

  return { rows: [], rowCount: 0 }
}
