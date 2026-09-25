import { defineNuxtPlugin } from '#app'

import { createFormApi, formApiKey } from '../composables/use-form-api'

/**
 * One form API for the whole app: components reach it with `useFormApi()`, and code running outside
 * setup (actions, stores) with `useNuxtApp().$formApi`. `<NutFormProvider>` renders its overlays.
 */
export default defineNuxtPlugin({
  name: 'nuxt-ui-tools:form-api',
  setup(nuxtApp) {
    const formApi = createFormApi()
    nuxtApp.vueApp.provide(formApiKey, formApi)

    return { provide: { formApi } }
  },
})
