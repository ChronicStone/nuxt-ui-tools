import { computed, toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'

import { isSpreadsheetQueryDefinition } from '../utils'
import { useSpreadsheetQueries } from './use-spreadsheet-queries'

export interface UseSpreadsheetContextParams {
  /** Entries of `options.context`: values, refs, getters, or queries. */
  input: MaybeRefOrGetter<Readonly<Record<string, unknown>> | undefined>
}

/** The context passed to every schema callback: plain entries as they are, queries once loaded. */
export function useSpreadsheetContext(params: UseSpreadsheetContextParams) {
  const entries = computed(() =>
    Object.entries(toValue(params.input) ?? {}).map(([key, entry]) => {
      const resolved = toValue(entry)
      return isSpreadsheetQueryDefinition<unknown>(resolved)
        ? { key, kind: 'query' as const, query: resolved }
        : { key, kind: 'value' as const, value: resolved }
    }),
  )
  const queries = computed(() =>
    entries.value.flatMap((entry) => (entry.kind === 'query' ? [entry.query] : [])),
  )
  const results = useSpreadsheetQueries(() => queries.value)

  const ctx = computed(() => {
    let queryIndex = 0
    const data: Record<string, unknown> = {}
    for (const entry of entries.value) {
      if (entry.kind === 'value') data[entry.key] = entry.value
      else {
        data[entry.key] = results.value[queryIndex]?.data
        queryIndex += 1
      }
    }
    return data
  })
  const loading = computed(() => results.value.some((result) => result.pending))
  const error = computed(() => results.value.find((result) => result.error)?.error ?? null)
  const ready = computed(() => !loading.value && !error.value)

  return { ctx, error, loading, ready }
}
