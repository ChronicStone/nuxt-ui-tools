/**
 * Page envelope returned by an index-paginated remote option source.
 */
export interface RemoteOptionsPage<TOption> {
  options: readonly TOption[]
  hasMore: boolean
}

/**
 * Page envelope returned by a cursor-paginated remote option source.
 */
export interface RemoteCursorOptionsPage<TOption> {
  options: readonly TOption[]
  nextCursor: string | null
}

export type RemoteOptionsResult<TOption> =
  | RemoteOptionsPage<TOption>
  | RemoteCursorOptionsPage<TOption>

/**
 * Page requested from a remote option source. `cursor` is set for cursor pagination and `index`
 * (1-based) for page pagination.
 */
export interface RemoteOptionsPageRequest {
  index: number
  cursor: string | null
  size: number
}

export interface RemoteOptionsPagination {
  type: 'page' | 'cursor'
  /** Page size forwarded to the source. */
  size: number
  /** Distance from the list end that triggers the next page: pixels, or `'viewport'` for three viewport heights. Defaults to `'viewport'`. */
  prefetchDistance?: number | 'viewport'
}

export interface RemoteOptionsSearch {
  /** Debounce applied to typed search terms, in milliseconds. Defaults to 250. */
  debounce?: number
  /** Minimum term length before a search request runs. Defaults to 0. */
  minLength?: number
}
