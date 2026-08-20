import type { QueryClient } from '@tanstack/vue-query'
import type {
  RouteLocationResolvedGeneric,
  RouteMap,
  RouteMapGeneric,
  RouteParamsGeneric,
} from 'vue-router'

import type { QueryPrefetchEntry } from './plan'

type RouteMapNames = Extract<keyof RouteMap, string>

/**
 * Route names usable with `defineQueryPrefetch(...)`.
 *
 * Falls back to plain `string` when `experimental.typedPages` is disabled, so
 * the macro stays usable in apps without typed routes.
 */
export type QueryPrefetchRouteName = [RouteMap] extends [RouteMapGeneric] ? string : RouteMapNames

type QueryPrefetchRouteParams<TRouteName extends QueryPrefetchRouteName> = [RouteMap] extends [
  RouteMapGeneric,
]
  ? RouteParamsGeneric
  : TRouteName extends keyof RouteMap
    ? RouteMap[TRouteName]['params']
    : RouteParamsGeneric

export type QueryPrefetchRuntimeRoute = Pick<
  RouteLocationResolvedGeneric,
  'fullPath' | 'hash' | 'name' | 'params' | 'path' | 'query'
>

/**
 * The destination route exposed to a prefetch resolver, with `params` narrowed
 * from the route name when typed pages are enabled.
 */
export type QueryPrefetchRoute<TRouteName extends QueryPrefetchRouteName> = Omit<
  QueryPrefetchRuntimeRoute,
  'params'
> & {
  params: QueryPrefetchRouteParams<TRouteName>
}

/**
 * What a page-level prefetch resolver may return: a single query, a staged
 * plan, or a mixed array of both (array entries run in parallel).
 */
export type QueryPrefetchOptions = QueryPrefetchEntry | readonly QueryPrefetchEntry[]

export type QueryPrefetchRuntimeContext = {
  queryClient: QueryClient
  route: QueryPrefetchRuntimeRoute
}

export type QueryPrefetchResolveContext<TRouteName extends QueryPrefetchRouteName> = {
  queryClient: QueryClient
  route: QueryPrefetchRoute<TRouteName>
}

/**
 * A page's declared data requirements, stored on `route.meta.queryPrefetch` by
 * the `defineQueryPrefetch(...)` macro and executed on link prefetch or through
 * `prefetchPage(...)`.
 */
export interface QueryPrefetchDefinition {
  resolve: (context: QueryPrefetchRuntimeContext) => QueryPrefetchOptions
  routeName: QueryPrefetchRouteName
}

declare module 'vue-router' {
  interface RouteMeta {
    queryPrefetch?: QueryPrefetchDefinition
  }
}

declare module 'nuxt/app' {
  interface PageMeta {
    queryPrefetch?: QueryPrefetchDefinition
  }
}
