import type { UseQueryOptions } from '@tanstack/vue-query'

import type {
  GenericObject,
  TableFieldPath,
  TableSortKey,
  TablePaginationState,
  TableSortingRule,
  TableRowsFromSourceResult,
} from './utils'

export type TableQueryDefinition<TData = unknown> = UseQueryOptions<TData>

export interface TableSourceExecutionResult<TRow extends GenericObject = GenericObject> {
  rows: TRow[]
  rowCount: number
}

export interface TableSourceRequestContext<
  TRow extends GenericObject = GenericObject,
  TFilterKey extends string = TableFieldPath<TRow>,
  TSortKey extends string = TableSortKey<TRow>,
  TContext extends GenericObject = GenericObject,
> {
  pagination: TablePaginationState
  sorting: readonly TableSortingRule<TSortKey>[]
  filters: Partial<Record<TFilterKey, unknown>>
  search: string
  context: TContext
  rowType?: TRow
}

export interface TableSerializerDefinition<
  TResponse = unknown,
  TRow extends GenericObject = GenericObject,
> {
  key: string
  fromResponse?: (response: TResponse) => TableSourceExecutionResult<TRow>
}

interface TableSourceTypeMetadata<
  TRow extends GenericObject,
  TFilterKey extends string,
  TSortKey extends string,
> {
  __rowType?: TRow
  __filterKey?: TFilterKey
  __sortKey?: TSortKey
}

export type TableClientSource<
  TRow extends GenericObject = GenericObject,
  TFilterKey extends string = TableFieldPath<TRow>,
  TSortKey extends string = TableSortKey<TRow>,
> = TableSourceTypeMetadata<TRow, TFilterKey, TSortKey> & {
  mode: 'client'
  query: (
    ctx: TableSourceRequestContext<TRow, TFilterKey, TSortKey>,
  ) => TableQueryDefinition<readonly TRow[]>
}

export type TableRemoteSource<
  TRow extends GenericObject = GenericObject,
  TFilterKey extends string = TableFieldPath<TRow>,
  TSortKey extends string = TableSortKey<TRow>,
  TResponse = TableSourceExecutionResult<TRow>,
> = TableSourceTypeMetadata<TRow, TFilterKey, TSortKey> & {
  mode: 'remote'
  query: (
    ctx: TableSourceRequestContext<TRow, TFilterKey, TSortKey>,
  ) => TableQueryDefinition<TResponse>
  serializer?: TableSerializerDefinition<TResponse, TRow> | string
}

export type TableSource<
  TRow extends GenericObject = GenericObject,
  TFilterKey extends string = TableFieldPath<TRow>,
  TSortKey extends string = TableSortKey<TRow>,
  TResponse = TableSourceExecutionResult<TRow>,
> =
  | TableClientSource<TRow, TFilterKey, TSortKey>
  | TableRemoteSource<TRow, TFilterKey, TSortKey, TResponse>

export type InferTableSourceFilterKey<TSource> = TSource extends { __filterKey?: infer TFilterKey }
  ? TFilterKey extends string
    ? TFilterKey
    : never
  : never

export type InferTableSourceSortKey<TSource> = TSource extends { __sortKey?: infer TSortKey }
  ? TSortKey extends string
    ? TSortKey
    : string
  : string

type ExtractSourceResult<TSource> = TSource extends {
  query: (...args: never[]) => TableQueryDefinition<infer TResult>
}
  ? Awaited<TResult>
  : never

export type InferTableSourceRow<TSource> = TSource extends { __rowType?: infer TRow }
  ? [TRow] extends [never]
    ? TableRowsFromSourceResult<ExtractSourceResult<TSource>>
    : TRow
  : TableRowsFromSourceResult<ExtractSourceResult<TSource>>
