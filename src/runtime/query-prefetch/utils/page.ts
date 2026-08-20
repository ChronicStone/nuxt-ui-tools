import type { QueryClient } from '@tanstack/vue-query'

import type {
  QueryPrefetchDefinition,
  QueryPrefetchOptions,
  QueryPrefetchResolveContext,
  QueryPrefetchRouteName,
  QueryPrefetchRuntimeContext,
} from '../types/page'
import type { QueryPrefetchEntry, QueryPrefetchOption } from '../types/plan'
import type { QueryPrefetchContext } from '../types/plan'
import { hasProperty, isFunction, isObject } from '#ui-tools/shared/utils/predicate'
import { executeQueryPrefetchPlan, isQueryPrefetchPlan } from './plan'

/**
 * Declares the data a page needs, for use as a page macro:
 *
 * ```ts
 * defineQueryPrefetch('items', ({ route }) => prefetchTable({ route, schema: itemsSchema() }))
 * ```
 *
 * A build-time transform moves the call into `definePageMeta({ queryPrefetch })`,
 * so any resolved route carries its own data requirements. The definition is
 * executed when Nuxt links prefetch the route (`link:prefetch`) or when
 * `prefetchPage(...)` is called manually (hover menus, buttons, middleware).
 *
 * Route names and `route.params` are typed when `experimental.typedPages` is
 * enabled; otherwise any string route name is accepted.
 */
export function defineQueryPrefetch<
  const TRouteName extends QueryPrefetchRouteName,
  const TOptions extends QueryPrefetchOptions,
>(
  routeName: TRouteName,
  resolve: (context: QueryPrefetchResolveContext<TRouteName>) => TOptions,
): QueryPrefetchDefinition {
  return {
    routeName,
    resolve: (context) =>
      resolve({
        queryClient: context.queryClient,
        route: narrowQueryPrefetchRoute(context.route, routeName),
      }),
  }
}

/**
 * Executes a page's prefetch definition: plain query options are prefetched in
 * parallel, staged plans run through `executeQueryPrefetchPlan(...)`. Returns
 * the resolved data per entry (plans contribute their first stage's first
 * result), unwrapping single-element arrays.
 */
export function executeQueryPrefetch(
  definition: QueryPrefetchDefinition,
  context: QueryPrefetchRuntimeContext,
) {
  return Promise.resolve()
    .then(() => definition.resolve(context))
    .then((resolved) => {
      const entries = isQueryPrefetchEntry(resolved) ? [resolved] : resolved
      return Promise.all(
        entries.map((entry) => {
          if (!isQueryPrefetchPlan(entry)) return executeQueryOptions([entry], context.queryClient)
          return executeQueryPrefetchPlan(entry, {
            queryClient: context.queryClient,
          }).then((stageContext) => Object.values(stageContext)[0])
        }),
      )
    })
    .then((results) =>
      results.map((result) => (Array.isArray(result) && result.length === 1 ? result[0] : result)),
    )
    .catch(() => [])
}

function executeQueryOptions(queries: readonly QueryPrefetchOption[], queryClient: QueryClient) {
  return Promise.all(
    queries.map(async (query) => {
      if (hasProperty(query, 'enabled') && query.enabled === false) return undefined

      try {
        await queryClient.ensureQueryData({ ...query, revalidateIfStale: true })
        const data = queryClient.getQueryData<QueryPrefetchContext[string]>(query.queryKey)
        const select = hasProperty(query, 'select') ? query.select : undefined
        return data !== undefined && isQueryPrefetchSelector(select) ? select(data) : data
      } catch {
        return undefined
      }
    }),
  )
}

function isQueryPrefetchEntry(value: QueryPrefetchOptions): value is QueryPrefetchEntry {
  if (Array.isArray(value)) return false
  return isQueryPrefetchPlan(value) || 'queryKey' in value
}

type QueryPrefetchSelector = (data: QueryPrefetchContext[string]) => QueryPrefetchContext[string]

function isQueryPrefetchSelector(value: QueryPrefetchContext[string]): value is QueryPrefetchSelector {
  return isFunction(value)
}

function narrowQueryPrefetchRoute<TRouteName extends QueryPrefetchRouteName>(
  route: QueryPrefetchRuntimeContext['route'],
  routeName: TRouteName,
): QueryPrefetchResolveContext<TRouteName>['route'] {
  if (isQueryPrefetchRoute(route, routeName)) return route
  throw new Error(`Unable to resolve typed query-prefetch route ${String(routeName)}`)
}

function isQueryPrefetchRoute<TRouteName extends QueryPrefetchRouteName>(
  route: QueryPrefetchRuntimeContext['route'],
  _routeName: TRouteName,
): route is QueryPrefetchResolveContext<TRouteName>['route'] {
  return isObject(route.params)
}
