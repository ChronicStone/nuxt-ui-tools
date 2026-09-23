import type { QueryFunctionContext, QueryKey } from '@tanstack/vue-query'

import type { QueryFnDefinition } from '../../shared/types/query'
import type {
  RemoteOptionsPageRequest,
  RemoteOptionsSearch,
} from '../../shared/types/remote-options'
import { isArray, isFunction, isObject } from '../../shared/utils/predicate'
import type {
  GenericObject,
  RemoteTableOption,
  RemoteTableOptions,
  RemoteTableOptionsConfig,
  RemoteTableQuery,
  RemoteTableQueryDefinition,
  RemoteTableQueryRow,
  RemoteTableResult,
  TableRemoteSourceRequest,
  TableSortingRule,
} from '../types'

const DEFAULT_PAGINATION = { size: 25, type: 'cursor' } as const

/**
 * Turns an endpoint that speaks the table request protocol into a remote option source: searchable,
 * paged, with labels of selected values resolved by an `isAnyOf` filter on `valueKey`. Use it for
 * dashboard filters (`p.remote(...)`), table option filters (`source.remote`), and form remote
 * options (`source: options.load`).
 *
 * Each page is its own query, keyed after the endpoint's key, so pages are cached and shared by
 * every picker using the same source.
 *
 * The query comes first: the row type is read from its result, so `option` and `search` are typed
 * whatever order the options are written in.
 *
 * @example
 * ```ts
 * const accounts = remoteTableOptions(
 *   (request) => $api.accounts.query.queryOptions({ body: request }),
 *   {
 *     search: ['name'],
 *     sort: 'name',
 *     option: (account) => ({ label: account.name, value: account.id }),
 *   },
 * )
 * ```
 */
export function remoteTableOptions<
  TQuery extends RemoteTableQueryDefinition,
  const TOption extends RemoteTableOption,
>(
  query: RemoteTableQuery<TQuery>,
  config: RemoteTableOptionsConfig<RemoteTableQueryRow<TQuery>, TOption>,
): RemoteTableOptions<TOption>
export function remoteTableOptions(
  query: RemoteTableQuery,
  config: RemoteTableOptionsConfig<GenericObject, RemoteTableOption>,
): RemoteTableOptions<RemoteTableOption> {
  const pagination = config.pagination ?? DEFAULT_PAGINATION
  const { fields, search } = resolveSearch(config.search)
  const sorting = resolveSorting(config.sort)

  function request(params: {
    page: RemoteOptionsPageRequest
    search: string
    filters?: TableRemoteSourceRequest['filters']
  }): TableRemoteSourceRequest {
    const { page } = params
    return {
      filters: [...(config.filters ?? []), ...(params.filters ?? [])],
      pagination:
        pagination.type === 'cursor'
          ? { count: 'none', cursor: page.cursor, mode: 'cursor', pageSize: page.size }
          : { count: 'exact', mode: 'offset', pageIndex: page.index - 1, pageSize: page.size },
      search: { fields: [...fields], value: params.search },
      sorting: params.filters ? [] : [...sorting],
    }
  }

  return {
    load: ({ page, search: term }) =>
      mapQuery(query(request({ page, search: term })), (result) => ({
        ...resolvePage(result),
        options: result.rows.map(config.option),
      })),
    pagination,
    resolveSelected: ({ values }) =>
      mapQuery(
        query(
          request({
            filters: [
              {
                children: [
                  {
                    key: config.valueKey ?? 'id',
                    operator: 'isAnyOf',
                    type: 'condition',
                    value: [...values],
                  },
                ],
                combinator: 'and',
                type: 'group',
              },
            ],
            page: { cursor: null, index: 1, size: Math.max(1, values.length) },
            search: '',
          }),
        ),
        (result) => result.rows.map(config.option),
      ),
    search,
  }
}

/** Runs a table query and maps its response, under a key of its own (the response shape differs). */
function mapQuery<TResult>(
  definition: RemoteTableQueryDefinition,
  map: (result: RemoteTableResult<GenericObject>) => TResult,
): QueryFnDefinition<TResult> {
  const { queryKey } = definition
  const queryFn = 'queryFn' in definition ? definition.queryFn : undefined
  return {
    async queryFn(context) {
      if (!isQueryFn(queryFn))
        throw new Error('[remoteTableOptions] `query` must return a query with a queryFn.')
      const result: unknown = await queryFn({ ...context, queryKey })
      if (!isTableResult(result))
        throw new Error('[remoteTableOptions] the query must resolve to a table response (`rows`).')
      return map(result)
    },
    queryKey: [...queryKey, 'remote-options'],
  }
}

/** A `queryFn` ready to call: not `skipToken`, not a ref (Vue Query options may carry either). */
function isQueryFn(
  value: unknown,
): value is (context: QueryFunctionContext<QueryKey, string | null>) => unknown {
  return isFunction(value)
}

function isTableResult(value: unknown): value is RemoteTableResult<GenericObject> {
  return isObject(value) && isArray(value.rows)
}

function resolvePage(
  result: RemoteTableResult<GenericObject>,
): { hasMore: boolean } | { nextCursor: string | null } {
  if (!('pageInfo' in result)) return { hasMore: false }
  return result.pageInfo.mode === 'cursor'
    ? { nextCursor: result.pageInfo.nextCursor }
    : { hasMore: result.pageInfo.hasNextPage }
}

/** Fields the term looks in, and the search options (debounce, minimum length) if any. */
function resolveSearch<TField extends string>(
  search: readonly TField[] | ({ fields: readonly TField[] } & RemoteOptionsSearch) | undefined,
) {
  if (!search) return { fields: [], search: undefined }
  if (isFieldList(search)) return { fields: search, search: undefined }
  const { fields, ...options } = search
  return { fields, search: options }
}

function isFieldList<TField extends string>(
  value: readonly TField[] | { fields: readonly TField[] },
): value is readonly TField[] {
  return Array.isArray(value)
}

function resolveSorting<TKey extends string>(
  sort: TKey | readonly TableSortingRule<TKey>[] | undefined,
): readonly TableSortingRule<TKey>[] {
  if (sort === undefined) return []
  return isSortingRules(sort) ? sort : [{ dir: 'asc', key: sort }]
}

function isSortingRules<TKey extends string>(
  sort: TKey | readonly TableSortingRule<TKey>[],
): sort is readonly TableSortingRule<TKey>[] {
  return Array.isArray(sort)
}
