import { useQueryClient, type QueryClient } from '@tanstack/vue-query'
import { preloadRouteComponents, useNuxtApp, useRouter } from 'nuxt/app'
import type { RouteLocationRaw } from 'vue-router'

import { isString } from '#ui-tools/shared/utils/predicate'

import { executeQueryPrefetch } from './page'

const pendingPagePrefetches = new WeakMap<object, Map<string, Promise<void>>>()

/**
 * Prefetches a route's declared data (`route.meta.queryPrefetch`) and its lazy
 * components without navigating.
 *
 * Wired automatically to Nuxt's `link:prefetch` hook by the module, so plain
 * `<NuxtLink>` prefetch strategies trigger it. Call it manually for non-link
 * interactions such as hover menus:
 *
 * ```ts
 * onMouseenter: () => prefetchPage('/items')
 * ```
 *
 * In-flight prefetches are deduped per destination `fullPath`, cross-origin
 * URLs are ignored, and normal query staleness rules own any later refetch.
 */
export function prefetchPage(to: RouteLocationRaw): Promise<void> {
  const nuxtApp = useNuxtApp()
  const router = useRouter()
  const route = resolvePrefetchRoute(to, router)
  if (!route?.matched.length) return Promise.resolve()

  let pendingPages = pendingPagePrefetches.get(nuxtApp)
  if (!pendingPages) {
    pendingPages = new Map()
    pendingPagePrefetches.set(nuxtApp, pendingPages)
  }

  const pending = pendingPages.get(route.fullPath)
  if (pending) return pending

  const definition = route.meta.queryPrefetch
  const prefetch = Promise.allSettled([
    Promise.resolve().then(() => {
      if (import.meta.client) return preloadRouteComponents(route.fullPath, router)
      return undefined
    }),
    definition
      ? Promise.resolve().then(() =>
          nuxtApp.runWithContext(() =>
            executeQueryPrefetch(definition, {
              queryClient: resolvePrefetchQueryClient(),
              route,
            }),
          ),
        )
      : Promise.resolve(),
  ]).then(() => undefined)

  pendingPages.set(route.fullPath, prefetch)
  return prefetch.finally(() => {
    pendingPages.delete(route.fullPath)
  })
}

function resolvePrefetchRoute(to: RouteLocationRaw, router: ReturnType<typeof useRouter>) {
  if (import.meta.server || !isString(to)) return router.resolve(to)

  const target = new URL(to, window.location.href)
  if (target.origin !== window.location.origin) return null

  return router.resolve(`${target.pathname}${target.search}${target.hash}`)
}

/**
 * Resolves the app's TanStack query client outside of a component setup.
 *
 * `vueApp.runWithContext(...)` provides the injection context that
 * `useQueryClient()` needs, so any app installing `VueQueryPlugin` is covered
 * without extra wiring.
 */
function resolvePrefetchQueryClient(): QueryClient {
  const nuxtApp = useNuxtApp()
  return nuxtApp.vueApp.runWithContext(() => useQueryClient())
}
