import type { QueryFunctionContext, QueryKey } from '@tanstack/vue-query'

import type {
  GenericObject,
  TableClientSource,
  TableCursorPageResult,
  TableGlobalFacetDescriptor,
  TableOffsetPageResult,
  TablePaginationState,
  TableQueryDefinition,
  TableRemoteSource,
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

type TableSourceQueryDefinition<TResult> = Omit<TableQueryDefinition<unknown>, 'queryFn'> & {
  queryFn: (context: QueryFunctionContext<QueryKey, string | null>) => TResult | Promise<TResult>
}

interface ClientTableSourceInput<TResult extends TableSourceResult> {
  mode?: 'client'
  query: (context: TableSourceInferenceContext) => TableSourceQueryDefinition<TResult>
}

interface RemoteTableSourceInput<TResult extends TableSourceRowsResult> {
  mode: 'remote'
  query: (context: TableSourceInferenceContext) => TableSourceQueryDefinition<TResult>
  facets?: TableRemoteSource['facets']
}

interface TableSourceInput {
  mode?: 'client' | 'remote'
  query: (context: never) => TableQueryDefinition<TableSourceResult>
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
export function tableSource<TResult extends TableSourceRowsResult>(
  source: RemoteTableSourceInput<TResult>,
): TableRemoteSource<TableSourceRow<TResult>, GenericObject, RemoteTableSourceResult<TResult>>
export function tableSource<TResult extends TableSourceResult>(
  source: ClientTableSourceInput<TResult>,
): TableClientSource<TableSourceRow<TResult>, GenericObject, ClientTableSourceResult<TResult>>
export function tableSource(source: TableSourceInput) {
  return source
}
