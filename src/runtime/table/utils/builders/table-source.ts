import type { QueryKey } from '@tanstack/vue-query'

import type {
  GenericObject,
  TableClientSource,
  TableCursorPageResult,
  TableGlobalFacetDescriptor,
  TableOffsetPageResult,
  TablePaginationState,
  TableRemoteSource,
  TableRemoteSourceRequest,
  TableResolvedFilterGroup,
  TableSourceExecutionResult,
  TableSourceQueryResult,
  TableSourceRow,
  TableSortingRule,
} from '../../types'

type ClientTableSourceResult<TResult> = TResult extends readonly GenericObject[]
  ? TableSourceRow<TResult>[]
  : TableSourceExecutionResult<TableSourceRow<TResult>>

type RemoteTableSourceResult<TResult> = TResult extends {
  pageInfo: { nextCursor: string | null }
}
  ? TableCursorPageResult<TableSourceRow<TResult>> & SummaryFromResult<TResult>
  : TResult extends { pageInfo: { pageIndex: number } }
    ? TableOffsetPageResult<TableSourceRow<TResult>> & SummaryFromResult<TResult>
    : TableSourceExecutionResult<TableSourceRow<TResult>> & SummaryFromResult<TResult>

type SummaryFromResult<TResult> = TResult extends { summary: infer TSummary }
  ? { summary: TSummary }
  : TResult extends { summary?: infer TSummary }
    ? { summary?: TSummary }
    : object

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
  query: (...args: never[]) => TableSourceQueryDefinition
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
