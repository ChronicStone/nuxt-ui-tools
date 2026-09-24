import type { QueryKey } from '@tanstack/vue-query'

import type { QueryFnDefinition, QueryFunctionResult } from './query'

export type RemoteOptionValue = string | number | boolean

/** Option shape shared by dashboard, table, and form remote pickers. */
export interface RemoteOption<TValue extends RemoteOptionValue = RemoteOptionValue> {
  value: TValue
  label: string
}

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

/** One reusable, query-backed option source. Inline remote definitions remain supported. */
export interface RemoteOptionsLoader<TOption> {
  load: (request: {
    search: string
    page: RemoteOptionsPageRequest
  }) => QueryFnDefinition<RemoteOptionsResult<TOption>>
  resolveSelected: (request: {
    values: readonly RemoteOptionValue[]
  }) => QueryFnDefinition<readonly TOption[]>
  pagination: RemoteOptionsPagination
  search?: RemoteOptionsSearch
  /** Identity of a page query, used by pickers that cache an infinite list as one query. */
  queryKeyFor?: (request: { search: string; page: RemoteOptionsPageRequest }) => QueryKey
  /** Identity of a selected-value lookup, including any scope used only by that endpoint. */
  selectedQueryKeyFor?: (request: { values: readonly RemoteOptionValue[] }) => QueryKey
}

/** Query options returned by an endpoint or generated client. */
export interface RemoteOptionsQueryDefinition {
  queryKey: QueryKey
}

/** Endpoint query definitions; supplied before mapping so their result types are inferred first. */
export interface RemoteOptionsQueries<
  TPageQuery extends RemoteOptionsQueryDefinition,
  TSelectedQuery extends RemoteOptionsQueryDefinition,
> {
  load: (request: { search: string; page: RemoteOptionsPageRequest }) => TPageQuery
  resolveSelected: (request: { values: readonly RemoteOptionValue[] }) => TSelectedQuery
}

/** Maps endpoint responses to the option result shared by all three pickers. */
export interface DefineRemoteOptionsConfig<
  TPageQuery extends RemoteOptionsQueryDefinition,
  TSelectedQuery extends RemoteOptionsQueryDefinition,
  TOption extends RemoteOption,
> {
  /** Stable namespace for mapped query results; requests still use their endpoint query keys. */
  key: string
  /** Maps the endpoint page to options and the next-page marker. */
  mapPage: (result: QueryFunctionResult<TPageQuery>) => RemoteOptionsResult<TOption>
  /** Maps selected lookup results to option items. */
  mapSelected: (result: QueryFunctionResult<TSelectedQuery>) => readonly NoInfer<TOption>[]
  /** Page type and size expected by the endpoint. */
  pagination: RemoteOptionsPagination
  /** Debounce and minimum term length applied by the consuming picker. */
  search?: RemoteOptionsSearch
}
