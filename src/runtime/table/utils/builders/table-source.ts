import type { QueryKey, UseQueryOptions } from '@tanstack/vue-query'

import type {
  GenericObject,
  TableClientSource,
  TableCursorPageResult,
  TableGlobalFacetDescriptor,
  TableOffsetPageResult,
  TablePaginationState,
  TableQueryDefinition,
  TableRemoteSource,
  TableRemoteSourceRequest,
  TableResolvedFilterGroup,
  TableRowsFromSourceResult,
  TableSourceExecutionResult,
  TableSortingRule,
} from '../../types'

interface TableSourceRowsResult {
  rows: readonly GenericObject[]
}

type TableSourceResult = readonly GenericObject[] | TableSourceRowsResult

type TableSourceRow<TResult> =
  TableRowsFromSourceResult<Awaited<TResult>> extends infer TRow
    ? TRow extends GenericObject
      ? TRow
      : GenericObject
    : GenericObject

type ClientTableSourceResult<TResult> = TResult extends readonly GenericObject[]
  ? TableSourceRow<TResult>[]
  : TableSourceExecutionResult<TableSourceRow<TResult>>

type RemoteTableSourceResult<TResult> = TResult extends {
  pageInfo: { nextCursor: string | null }
}
  ? TableCursorPageResult<TableSourceRow<TResult>>
  : TResult extends { pageInfo: { pageIndex: number } }
    ? TableOffsetPageResult<TableSourceRow<TResult>>
    : TableSourceExecutionResult<TableSourceRow<TResult>>

interface TableSourceInferenceContext {
  pagination: TablePaginationState
  sorting: TableSortingRule<never>[]
  filters: TableResolvedFilterGroup<never>
  search: {
    value: string
    fields: never[]
  }
  context: GenericObject
  facets?: TableGlobalFacetDescriptor<never>[]
}

interface TableSourceQueryDefinition {
  queryKey: QueryKey
}

type TableSourceQueryResult<TQuery> = TQuery extends UseQueryOptions<
  infer TResult,
  any,
  any,
  any
>
  ? Awaited<TResult>
  : TQuery extends { queryFn?: (...args: never[]) => infer TResult }
    ? Awaited<TResult>
    : never

interface ClientTableSourceInput<TQuery extends TableSourceQueryDefinition> {
  mode?: 'client'
  query: (context: TableSourceInferenceContext) => TQuery
}

interface RemoteTableSourceInput<TQuery extends TableSourceQueryDefinition> {
  mode: 'remote'
  query: (
    request: TableRemoteSourceRequest<GenericObject, string>,
    context: GenericObject,
  ) => TQuery
  facets?: TableRemoteSource['facets']
}

interface TableSourceInput {
  mode?: 'client' | 'remote'
  query: (...args: any[]) => TableSourceQueryDefinition
  facets?: TableRemoteSource['facets']
}

/**
 * Defines a table source inline while preserving its query-result inference before the surrounding
 * schema derives row-aware filters, columns, actions, and page context.
 *
 * @example
 * ```ts
 * defineTableSchema({
 *   source: tableSource({
 *     mode: 'remote',
 *     query: (request) => ({
 *       queryKey: ['employees', request],
 *       queryFn: () => api.queryEmployees(request),
 *     }),
 *   }),
 * })
 * ```
 */
export function tableSource<TQuery extends TableSourceQueryDefinition>(
  source: RemoteTableSourceInput<TQuery>,
): TableRemoteSource<
  TableSourceRow<TableSourceQueryResult<TQuery>>,
  GenericObject,
  RemoteTableSourceResult<TableSourceQueryResult<TQuery>>
>
export function tableSource<TQuery extends TableSourceQueryDefinition>(
  source: ClientTableSourceInput<TQuery>,
): TableClientSource<
  TableSourceRow<TableSourceQueryResult<TQuery>>,
  GenericObject,
  ClientTableSourceResult<TableSourceQueryResult<TQuery>>
>
export function tableSource(source: TableSourceInput) {
  return source
}
