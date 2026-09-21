import type { QueryFunction, QueryKey, UseQueryOptions } from '@tanstack/vue-query'

/**
 * TanStack query definition accepted by runtime domains that own the `useQuery` call themselves
 * (table sources, dashboard queries): an explicit `queryKey`, an optional `queryFn`, and any other
 * query option.
 */
export type QueryDefinition<TData = unknown> = Omit<UseQueryOptions<TData>, 'queryFn'> & {
  queryKey: QueryKey
  queryFn?: QueryFunction<TData, QueryKey, string | null>
}
