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

type ClientTableSourceResult = GenericObject[] | TableSourceExecutionResult
type RemoteTableSourceResult =
  | TableSourceExecutionResult
  | TableOffsetPageResult
  | TableCursorPageResult
type TableSourceResult = ClientTableSourceResult | RemoteTableSourceResult

type TableSourceRow<TResult> =
  TableRowsFromSourceResult<Awaited<TResult>> extends infer TRow
    ? TRow extends GenericObject
      ? TRow
      : GenericObject
    : GenericObject

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

interface ClientTableSourceInput<TResult extends ClientTableSourceResult> {
  mode?: 'client'
  query: (context: TableSourceInferenceContext) => TableSourceQueryDefinition<TResult>
}

interface RemoteTableSourceInput<TResult extends RemoteTableSourceResult> {
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
export function tableSource<TResult extends RemoteTableSourceResult>(
  source: RemoteTableSourceInput<TResult>,
): TableRemoteSource<TableSourceRow<TResult>, GenericObject, TResult>
export function tableSource<TResult extends ClientTableSourceResult>(
  source: ClientTableSourceInput<TResult>,
): TableClientSource<TableSourceRow<TResult>, GenericObject, TResult>
export function tableSource(source: TableSourceInput) {
  return source
}
