import type { RemoteOptionsResult } from '../../shared/types/remote-options'
import { isNullish } from '../../shared/utils/predicate'
import type { DashboardOption } from '../types'

export interface DashboardRemotePageParam {
  index: number
  cursor: string | null
}

/** Normalizes a single or multiple param value to its string keys, in value order. */
export function resolveDashboardOptionValues(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((entry) => !isNullish(entry)).map(String)
  return isNullish(value) ? [] : [String(value)]
}

/** Next page of a page- or cursor-paginated remote source, or `undefined` at the end. */
export function resolveDashboardRemoteNextPage(
  page: RemoteOptionsResult<DashboardOption<string>>,
  loadedPages: number,
): DashboardRemotePageParam | undefined {
  if ('nextCursor' in page)
    return page.nextCursor ? { cursor: page.nextCursor, index: loadedPages + 1 } : undefined
  return page.hasMore ? { cursor: null, index: loadedPages + 1 } : undefined
}

/** Unique options by value, keeping the first occurrence. */
export function mergeDashboardOptions(
  ...lists: readonly (readonly DashboardOption[])[]
): DashboardOption[] {
  const seen = new Set<string>()
  const merged: DashboardOption[] = []
  for (const list of lists) {
    for (const option of list) {
      const key = String(option.value)
      if (seen.has(key)) continue
      seen.add(key)
      merged.push(option)
    }
  }
  return merged
}
