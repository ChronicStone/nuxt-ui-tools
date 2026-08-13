import type { InfiniteData, QueryFunction, QueryKey, UseQueryOptions } from '@tanstack/vue-query'

import type { TableResolvedFilterGroup } from './filters'
import type {
  GenericObject,
  TableKnownFieldPath,
  TablePaginationState,
  TableSortKey,
  TableSortingRule,
  TableRowsFromSourceResult,
} from './utils'

export type TableQueryDefinition<TData = unknown> = Omit<UseQueryOptions<TData>, 'queryFn'> & {
  queryKey: QueryKey
  queryFn?: QueryFunction<TData, QueryKey, string | null>
}

export interface TableInfiniteQueryDefinition<TData = unknown> {
  queryKey: QueryKey
  queryFn: QueryFunction<TData, QueryKey, string | null>
  initialPageParam: string | null
  getNextPageParam: (
    lastPage: TData,
    allPages: TData[],
    lastPageParam: string | null,
    allPageParams: Array<string | null>,
  ) => string | null | undefined
  enabled?: boolean
  staleTime?: number
  gcTime?: number
  refetchOnWindowFocus?: boolean
  initialData?: InfiniteData<TData, string | null> | (() => InfiniteData<TData, string | null>)
}

export type TableSourceMode = 'client' | 'remote'

export interface TableSourceExecutionResult<
  TRow extends GenericObject = GenericObject,
  TKey extends string = string,
> {
  rows: TRow[]
  rowCount: number
  facets?: TableFacetResult<TKey>[]
}

export type TableCursorPageInfo =
  | {
      mode: 'cursor'
      pageSize: number
      nextCursor: string | null
      count: 'none'
      rowCount: null
    }
  | {
      mode: 'cursor'
      pageSize: number
      nextCursor: string | null
      count: 'exact'
      rowCount: number
    }

export interface TableCursorPageResult<
  TRow extends GenericObject = GenericObject,
  TKey extends string = string,
> {
  rows: TRow[]
  pageInfo: TableCursorPageInfo
  facets?: TableFacetResult<TKey>[]
}

export interface TableGlobalFacetDescriptor<TKey extends string = string> {
  key: TKey
  mode?: 'exclude-self' | 'include-self'
  limit?: number
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

export interface TableSourceSearchRequest<TRow extends GenericObject = GenericObject> {
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
  facets?: TableGlobalFacetDescriptor<TableKnownFieldPath<TRow> | string>[]
}

export interface TableFacetsContext<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow> | string,
> {
  filters: TableResolvedFilterGroup<TKey>
  search: TableSourceSearchRequest<TRow>
  context: TContext
  facets: TableFacetRequestDescriptor<TKey>[]
}

export interface TableClientSource<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TResult = TableSourceExecutionResult<TRow> | TRow[],
> {
  mode?: 'client'
  query: (ctx: TableSourceRequestContext<TRow, TContext>) => TableQueryDefinition<TResult>
}

export type TableRemoteFacetSource<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TKey extends string = TableKnownFieldPath<TRow> | string,
> =
  | true
  | ((
      ctx: TableFacetsContext<TRow, TContext, TKey>,
    ) => TableQueryDefinition<TableFacetExecutionResult<TKey>>)

export interface TableRemoteSource<
  TRow extends GenericObject = GenericObject,
  TContext extends GenericObject = GenericObject,
  TResult =
    | TableSourceExecutionResult<TRow, TableKnownFieldPath<TRow> | string>
    | TableCursorPageResult<TRow, TableKnownFieldPath<TRow> | string>,
> {
  mode: 'remote'
  query: (ctx: TableSourceRequestContext<TRow, TContext>) => TableQueryDefinition<TResult>
  facets?: TableRemoteFacetSource<TRow, TContext>
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
      Extract<
        TResult,
        | TableSourceExecutionResult<TRow, TableKnownFieldPath<TRow> | string>
        | TableCursorPageResult<TRow, TableKnownFieldPath<TRow> | string>
      > extends never
        ?
            | TableSourceExecutionResult<TRow, TableKnownFieldPath<TRow> | string>
            | TableCursorPageResult<TRow, TableKnownFieldPath<TRow> | string>
        : Extract<
            TResult,
            | TableSourceExecutionResult<TRow, TableKnownFieldPath<TRow> | string>
            | TableCursorPageResult<TRow, TableKnownFieldPath<TRow> | string>
          >
    >

export type NormalizeTableSource<TSource, TContext extends GenericObject> = TSource extends {
  mode: 'remote'
}
  ? TableRemoteSource<InferTableSourceRow<TSource>, TContext, ExtractTableSourceResult<TSource>>
  : TableClientSource<InferTableSourceRow<TSource>, TContext, ExtractTableSourceResult<TSource>>

type ExtractQueryResult<TQuery> = TQuery extends {
  queryFn?: (...args: never[]) => Promise<infer TResult> | (infer TResult)
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

type NormalizeSourceRow<TRow> = TRow extends GenericObject ? TRow : GenericObject

export type InferTableSourceRow<TSource> = NormalizeSourceRow<
  TableRowsFromSourceResult<ExtractTableSourceResult<TSource>>
>
