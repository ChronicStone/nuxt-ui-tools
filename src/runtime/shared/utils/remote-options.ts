import type { RemoteOptionsResult } from '../types/remote-options'

/** Position of a page in a remote option source: its 1-based index, and its cursor when paged by cursor. */
export interface RemoteOptionsPageParam {
  index: number
  cursor: string | null
}

/** First page of any remote option source. */
export const REMOTE_OPTIONS_FIRST_PAGE: RemoteOptionsPageParam = { cursor: null, index: 1 }

/** Next page of a page- or cursor-paginated remote option source, or `undefined` at the end. */
export function resolveRemoteOptionsNextPage<TOption>(
  page: RemoteOptionsResult<TOption>,
  loadedPages: number,
): RemoteOptionsPageParam | undefined {
  if ('nextCursor' in page)
    return page.nextCursor ? { cursor: page.nextCursor, index: loadedPages + 1 } : undefined
  return page.hasMore ? { cursor: null, index: loadedPages + 1 } : undefined
}
