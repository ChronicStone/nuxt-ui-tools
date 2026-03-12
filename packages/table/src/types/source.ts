import type { GenericObject, MaybePromise, TableFieldPath, TableSortKey } from './utils'
import type { TablePaginationState, TableSortingRule } from './utils'

export interface TableSourceExecutionResult<TRow extends GenericObject = GenericObject> {
  rows: TRow[]
  rowCount: number
}

export interface TableSourceRequestContext<
  TRow extends GenericObject = GenericObject,
  TFilterKey extends string = TableFieldPath<TRow>,
  TSortKey extends string = TableSortKey<TRow>,
> {
  pagination: TablePaginationState
  sorting: readonly TableSortingRule<TSortKey>[]
  filters: Partial<Record<TFilterKey, unknown>>
  search: string
  rowType?: TRow
}

export interface TableSerializerContext<
  TRow extends GenericObject = GenericObject,
  TFilterKey extends string = TableFieldPath<TRow>,
  TSortKey extends string = TableSortKey<TRow>,
> {
  state: TableSourceRequestContext<TRow, TFilterKey, TSortKey>
}

export interface TableSerializerDefinition<
  TRequest = unknown,
  TResponse = unknown,
  TRow extends GenericObject = GenericObject,
  TFilterKey extends string = TableFieldPath<TRow>,
  TSortKey extends string = TableSortKey<TRow>,
> {
  key: string
  toRequest?: (
    context: TableSerializerContext<TRow, TFilterKey, TSortKey>,
  ) => TRequest
  fromResponse?: (response: TResponse) => TableSourceExecutionResult<TRow>
}

export type TableSourceLoader<
  TResult,
  TRow extends GenericObject = GenericObject,
  TFilterKey extends string = TableFieldPath<TRow>,
  TSortKey extends string = TableSortKey<TRow>,
> = (
  context: TableSourceRequestContext<TRow, TFilterKey, TSortKey>,
) => MaybePromise<TResult>

export type TableSourceQuery<
  TResult,
  TRow extends GenericObject = GenericObject,
  TFilterKey extends string = TableFieldPath<TRow>,
  TSortKey extends string = TableSortKey<TRow>,
> = (
  context: TableSourceRequestContext<TRow, TFilterKey, TSortKey>,
) => MaybePromise<TResult>

interface TableSourceTypeMetadata<
  TRow extends GenericObject,
  TFilterKey extends string,
  TSortKey extends string,
> {
  __rowType?: TRow
  __filterKey?: TFilterKey
  __sortKey?: TSortKey
}

type TableSourceLoaderBranch<
  TMode extends 'client' | 'remote',
  TResult,
  TRow extends GenericObject,
  TFilterKey extends string,
  TSortKey extends string,
> = TableSourceTypeMetadata<TRow, TFilterKey, TSortKey> & {
  mode: TMode
  loader: TableSourceLoader<TResult, TRow, TFilterKey, TSortKey>
  query?: never
}

type TableSourceQueryBranch<
  TMode extends 'client' | 'remote',
  TResult,
  TRow extends GenericObject,
  TFilterKey extends string,
  TSortKey extends string,
> = TableSourceTypeMetadata<TRow, TFilterKey, TSortKey> & {
  mode: TMode
  query: TableSourceQuery<TResult, TRow, TFilterKey, TSortKey>
  loader?: never
}

export type TableClientSource<
  TRow extends GenericObject = GenericObject,
  TFilterKey extends string = TableFieldPath<TRow>,
  TSortKey extends string = TableSortKey<TRow>,
> =
  | TableSourceLoaderBranch<'client', readonly TRow[], TRow, TFilterKey, TSortKey>
  | TableSourceQueryBranch<'client', readonly TRow[], TRow, TFilterKey, TSortKey>

export type TableRemoteSource<
  TRow extends GenericObject = GenericObject,
  TFilterKey extends string = TableFieldPath<TRow>,
  TSortKey extends string = TableSortKey<TRow>,
  TRequest = unknown,
  TResponse = TableSourceExecutionResult<TRow>,
> =
  | (TableSourceLoaderBranch<'remote', TResponse, TRow, TFilterKey, TSortKey> & {
      serializer?: string | TableSerializerDefinition<TRequest, TResponse, TRow, TFilterKey, TSortKey>
    })
  | (TableSourceQueryBranch<'remote', TResponse, TRow, TFilterKey, TSortKey> & {
      serializer?: string | TableSerializerDefinition<TRequest, TResponse, TRow, TFilterKey, TSortKey>
    })

export type TableSource<
  TRow extends GenericObject = GenericObject,
  TFilterKey extends string = TableFieldPath<TRow>,
  TSortKey extends string = TableSortKey<TRow>,
  TRequest = unknown,
  TResponse = TableSourceExecutionResult<TRow>,
> = TableClientSource<TRow, TFilterKey, TSortKey> | TableRemoteSource<TRow, TFilterKey, TSortKey, TRequest, TResponse>

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
