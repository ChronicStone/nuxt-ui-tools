import { useQueries } from '@tanstack/vue-query'

import type { QueryFnDefinition } from '#ui-tools/shared/types/query'

/**
 * Runs a reactive list of TanStack queries and reduces each result to what the import needs.
 * Used for context entries, option lists, remote label lookups, and stored records.
 */
export function useSpreadsheetQueries(queries: () => readonly QueryFnDefinition<unknown>[]) {
  return useQueries({
    combine: (results) =>
      results.map((result) => ({
        data: result.data,
        error: result.error,
        pending: result.isPending,
      })),
    queries: () => queries().map((query) => ({ ...query, retry: false })),
  })
}
