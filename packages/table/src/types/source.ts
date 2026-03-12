import type { UseQueryOptions } from '@tanstack/vue-query'

import type {
  GenericObject,
  TableKnownFieldPath,
  TablePaginationState,
  TableSortKey,
  TableSortingRule,
  TableRowsFromSourceResult,
} from './utils'
import type { TableResolvedFilterGroup } from './filters'

export type TableQueryDefinition<TData = unknown> = UseQueryOptions<TData>

export interface TableSourceExecutionResult<TRow extends GenericObject = GenericObject> {
  rows: TRow[]
  rowCount: number
}

export interface TableSourceSearchRequest<
  TRow extends GenericObject = GenericObject,
> {
  value: string
  fields: TableKnownFieldPath<TRow>[]
}

export interface TableSourceRequestContext<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TSortKey extends string = TableSortKey<TRow>,
> {
  pagination: TablePaginationState
  sorting: TableSortingRule<TSortKey>[]
  filters: TableResolvedFilterGroup<TableKnownFieldPath<TRow> | string>
  search: TableSourceSearchRequest<TRow>
  context: TContext
}

export interface TableSource<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TResult = TableSourceExecutionResult<TRow> | TRow[],
> {
  mode?: 'client' | 'remote'
  query: (ctx: TableSourceRequestContext<TRow, TContext>) => TableQueryDefinition<TResult>
}

type ExtractQueryResult<TQuery> = TQuery extends {
  queryFn?: (...args: never[]) => Promise<infer TResult> | infer TResult
}
  ? Awaited<TResult>
  : TQuery extends TableQueryDefinition<infer TResult>
    ? Awaited<TResult>
    : never

export type ExtractTableSourceResult<TSource> = TSource extends {
  query: (...args: never[]) => infer TQuery
}
  ? ExtractQueryResult<TQuery>
  : never

type NormalizeSourceRow<TRow> = TRow extends GenericObject
  ? TRow
  : GenericObject

export type InferTableSourceRow<TSource> = NormalizeSourceRow<
  TableRowsFromSourceResult<ExtractTableSourceResult<TSource>>
>
