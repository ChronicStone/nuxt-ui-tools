import type { QueryFunction, QueryKey, QueryOptions, UseQueryOptions } from '@tanstack/vue-query'

/**
 * TanStack query definition accepted by runtime domains that own the `useQuery` call themselves
 * (table sources, dashboard queries): an explicit `queryKey`, an optional `queryFn`, and any other
 * query option.
 */
export type QueryDefinition<TData = unknown> = Omit<UseQueryOptions<TData>, 'queryFn'> & {
  queryKey: QueryKey
  queryFn?: QueryFunction<TData, QueryKey, string | null>
}

/**
 * The smallest query definition: a key and the function that fetches it. Covariant in its data, so
 * a definition of specific options fits wherever a broader option type is expected.
 */
export interface QueryFnDefinition<TData = unknown> {
  queryKey: QueryKey
  queryFn: QueryFunction<TData, QueryKey, string | null>
}

/** Data returned by a query function, including generated options whose function may be a ref. */
export type QueryFunctionResult<TQuery> = TQuery extends {
  queryFn: (...args: never[]) => infer TResult
}
  ? Awaited<TResult>
  : TQuery extends QueryOptions<
        infer TQueryFnData,
        infer _TError,
        infer _TData,
        infer _TQueryData,
        infer _TQueryKey
      >
    ? Awaited<TQueryFnData>
    : TQuery extends UseQueryOptions<
          infer _TQueryFnData,
          infer _TError,
          infer TData,
          infer _TQueryData,
          infer _TQueryKey
        >
      ? Awaited<TData>
      : never
