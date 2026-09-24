import type { QueryFunctionResult } from '../types/query'
import type {
  DefineRemoteOptionsConfig,
  RemoteOption,
  RemoteOptionsLoader,
  RemoteOptionsQueries,
  RemoteOptionsQueryDefinition,
  RemoteOptionsResult,
} from '../types/remote-options'
import { mapRemoteOptionsQuery } from './remote-options-query'

/**
 * Defines a query-backed option loader once for dashboard filters, table filters, and form fields.
 * The endpoint's query key separates requests; `key` separates mapped option data from other
 * consumers of that endpoint. Inline remote definitions continue to work in each domain.
 *
 * @example
 * ```ts
 * const users = defineRemoteOptions({
 *   load: ({ search, page }) => api.users.list.queryOptions({ search, cursor: page.cursor }),
 *   resolveSelected: ({ values }) => api.users.byIds.queryOptions({ ids: values }),
 * }, {
 *   key: 'users',
 *   mapPage: ({ rows, nextCursor }) => ({
 *     options: rows.map((user) => ({ value: user.id, label: user.name })),
 *     nextCursor,
 *   }),
 *   mapSelected: ({ rows }) => rows.map((user) => ({ value: user.id, label: user.name })),
 *   pagination: { type: 'cursor', size: 25 },
 * })
 * ```
 */
export function defineRemoteOptions<
  TPageQuery extends RemoteOptionsQueryDefinition,
  TSelectedQuery extends RemoteOptionsQueryDefinition,
  const TOption extends RemoteOption,
>(
  queries: RemoteOptionsQueries<TPageQuery, TSelectedQuery>,
  config: DefineRemoteOptionsConfig<TPageQuery, TSelectedQuery, TOption>,
): RemoteOptionsLoader<TOption> {
  const suffix = ['remote-options', config.key]
  return {
    load: (request) =>
      mapRemoteOptionsQuery<QueryFunctionResult<TPageQuery>, RemoteOptionsResult<TOption>>(
        queries.load(request),
        config.mapPage,
        [...suffix, 'page'],
      ),
    pagination: config.pagination,
    queryKeyFor: (request) => [...queries.load(request).queryKey, ...suffix, 'page'],
    resolveSelected: (request) =>
      mapRemoteOptionsQuery<QueryFunctionResult<TSelectedQuery>, readonly TOption[]>(
        queries.resolveSelected(request),
        config.mapSelected,
        [...suffix, 'selected'],
      ),
    selectedQueryKeyFor: (request) => [
      ...queries.resolveSelected(request).queryKey,
      ...suffix,
      'selected',
    ],
    search: config.search,
  }
}
