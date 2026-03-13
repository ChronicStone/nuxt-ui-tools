import type { QueryFunction, QueryKey, UseQueryOptions } from '@tanstack/vue-query'

import type {
  GenericObject,
  TableKnownFieldPath,
  TablePaginationState,
  TableSortKey,
  TableSortingRule,
  TableRowsFromSourceResult,
} from './utils'
import type { TableResolvedFilterGroup } from './filters'

export type TableQueryDefinition<TData = unknown> = Omit<UseQueryOptions<TData>, 'queryFn'> & {
  queryKey: QueryKey
  queryFn?: QueryFunction<TData>
}

export type TableSourceMode = 'client' | 'remote'

export interface TableSourceExecutionResult<TRow extends GenericObject = GenericObject> {
  rows: TRow[]
  rowCount: number
}

export interface TableFacetRequestDescriptor<TKey extends string = string> {
  key: TKey
  mode?: 'exclude-self' | 'include-self'
  search?: string
  limit?: number
  cursor?: string | null
}

export interface TableFacetOptionResult<TValue = unknown> {
  value: TValue
  count: number
}

export interface TableFacetResult<TKey extends string = string, TValue = unknown> {
  key: TKey
  options: TableFacetOptionResult<TValue>[]
  nextCursor?: string | null
  total?: number
}

export interface TableFacetExecutionResult<TKey extends string = string, TValue = unknown> {
  facets: TableFacetResult<TKey, TValue>[]
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

export interface TableClientSource<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TResult = TableSourceExecutionResult<TRow> | TRow[],
> {
  mode?: 'client'
  query: (ctx: TableSourceRequestContext<TRow, TContext>) => TableQueryDefinition<TResult>
}

export interface TableRemoteSource<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TResult = TableSourceExecutionResult<TRow>,
> {
  mode: 'remote'
  query: (ctx: TableSourceRequestContext<TRow, TContext>) => TableQueryDefinition<TResult>
  facets?: (
    ctx: {
      table: TableSourceRequestContext<TRow, TContext>
      facets: TableFacetRequestDescriptor<TableKnownFieldPath<TRow> | string>[]
    },
  ) => TableQueryDefinition<TableFacetExecutionResult<TableKnownFieldPath<TRow> | string>>
}

export type TableSource<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TResult = TableSourceExecutionResult<TRow> | TRow[],
> =
  | TableClientSource<
      TRow,
      TContext,
      Extract<TResult, TableSourceExecutionResult<TRow> | TRow[]> extends never
        ? TableSourceExecutionResult<TRow> | TRow[]
        : Extract<TResult, TableSourceExecutionResult<TRow> | TRow[]>
    >
  | TableRemoteSource<
      TRow,
      TContext,
      Extract<TResult, TableSourceExecutionResult<TRow>> extends never
        ? TableSourceExecutionResult<TRow>
        : Extract<TResult, TableSourceExecutionResult<TRow>>
    >

export type NormalizeTableSource<
  TSource,
  TContext extends GenericObject,
> = TSource extends { mode: 'remote' }
  ? TableRemoteSource<InferTableSourceRow<TSource>, TContext, ExtractTableSourceResult<TSource>>
  : TableClientSource<InferTableSourceRow<TSource>, TContext, ExtractTableSourceResult<TSource>>

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
