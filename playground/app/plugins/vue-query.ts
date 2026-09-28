import { QueryClient, VueQueryPlugin, dehydrate, hydrate } from '@tanstack/vue-query'
import type { DehydratedState } from '@tanstack/vue-query'

declare global {
  interface Window {
    __TANSTACK_QUERY_CLIENT__: QueryClient
  }
}

export default defineNuxtPlugin((nuxtApp) => {
  const queryState = useState<DehydratedState | null>('vue-query', () => null)
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        staleTime: 30_000,
      },
    },
  })

  nuxtApp.vueApp.use(VueQueryPlugin, {
    enableDevtoolsV6Plugin: false,
    queryClient,
  })

  if (import.meta.server) {
    nuxtApp.hooks.hook('app:rendered', () => {
      queryState.value = dehydrate(queryClient)
    })
  }

  if (import.meta.client) {
    if (queryState.value) {
      hydrate(queryClient, queryState.value)
    }
    window.__TANSTACK_QUERY_CLIENT__ = queryClient
  }
})
