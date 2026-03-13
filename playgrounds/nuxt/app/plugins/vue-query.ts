import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'

declare global {
  interface Window {
    __TANSTACK_QUERY_CLIENT__: QueryClient
  }
}

export default defineNuxtPlugin((nuxtApp) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
    },
  })

  // This code is only for TypeScript

  // This code is for all users
  window.__TANSTACK_QUERY_CLIENT__ = queryClient

  nuxtApp.vueApp.use(VueQueryPlugin, {
    enableDevtoolsV6Plugin: false,
    queryClient,
  })
})
