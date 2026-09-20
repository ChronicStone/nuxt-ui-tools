import type { QueryKey } from '@tanstack/vue-query'

export function createTableCursorQueryKey(queryKey: QueryKey, revision: number) {
  return [...queryKey, { tableCursorRevision: revision }]
}
