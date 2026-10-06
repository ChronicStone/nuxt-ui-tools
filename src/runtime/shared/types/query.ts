import type {
  DataTag,
  QueryFunction,
  QueryKey,
  QueryMeta,
  UseQueryOptions,
} from '@tanstack/vue-query'
import type { UnwrapRef } from 'vue'

/**
 * TanStack query definition accepted by runtime domains that own the `useQuery` call themselves
 * (table sources, dashboard queries): an explicit `queryKey`, an optional `queryFn`, the `meta`
 * that every derived table query carries over, and any other query option.
 */
export type QueryDefinition<TData = unknown> = Omit<UseQueryOptions<TData>, 'queryFn'> & {
  queryKey: QueryKey
  queryFn?: QueryFunction<TData, QueryKey, string | null>
  meta?: QueryMeta
}

/**
 * The smallest query definition: a key and the function that fetches it. Covariant in its data, so
 * a definition of specific options fits wherever a broader option type is expected.
 */
export interface QueryFnDefinition<TData = unknown> {
  queryKey: QueryKey
  queryFn: QueryFunction<TData, QueryKey, string | null>
}

type FunctionResult<TFunction> = TFunction extends (...args: never[]) => infer TResult
  ? TResult
  : never

type QueryFnResult<TQuery> = TQuery extends { queryFn?: infer TQueryFn }
  ? Awaited<FunctionResult<UnwrapRef<Exclude<TQueryFn, undefined>>>>
  : never

/**
 * Data returned by a query definition. A tagged `queryKey` (TanStack `queryOptions`, generated
 * clients such as Tuyau) gives the data even when the options are ref-wrapped; otherwise the
 * `queryFn` result is used, unwrapping a ref and ignoring `skipToken`.
 */
export type QueryFunctionResult<TQuery> = TQuery extends {
  queryKey: DataTag<QueryKey, infer TTagged, infer _TError>
}
  ? TTagged
  : QueryFnResult<TQuery>
