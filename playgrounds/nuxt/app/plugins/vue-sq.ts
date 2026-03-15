import { createVueRouterAdapter, createVueQsPlugin } from 'vue-qs'

export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter()
  const queryAdapter = createVueRouterAdapter(router)
  nuxtApp.vueApp.use(createVueQsPlugin({ queryAdapter }))
})
