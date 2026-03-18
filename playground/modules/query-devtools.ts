import { addCustomTab } from '@nuxt/devtools-kit'
import { defineNuxtModule, addServerHandler, addPlugin, createResolver } from '@nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: 'query-devtools',
  },
  setup(_options, _nuxt) {
    const { resolve } = createResolver(import.meta.url)

    addCustomTab(() => ({
      name: 'query-state',
      title: 'Query State',
      icon: 'carbon:data-vis-1',
      view: {
        type: 'iframe',
        src: '/__query-devtools',
        persistent: true,
      },
    }))

    addServerHandler({
      route: '/__query-devtools',
      handler: resolve('../server/routes/__query-devtools.get'),
    })

    addPlugin({
      src: resolve('../app/plugins/query-devtools.client'),
      mode: 'client',
    })
  },
})
