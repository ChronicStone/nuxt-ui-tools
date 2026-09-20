import { addCustomTab } from '@nuxt/devtools-kit'
import { defineNuxtModule, addServerHandler, addPlugin, createResolver } from '@nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: 'query-devtools',
  },
  setup(_options, _nuxt) {
    const { resolve } = createResolver(import.meta.url)

    addCustomTab(() => ({
      icon: 'carbon:data-vis-1',
      name: 'query-state',
      title: 'Query State',
      view: {
        persistent: true,
        src: '/__query-devtools',
        type: 'iframe',
      },
    }))

    addServerHandler({
      handler: resolve('../server/routes/__query-devtools.get'),
      route: '/__query-devtools',
    })

    addPlugin({
      mode: 'client',
      src: resolve('../app/plugins/query-devtools.client'),
    })
  },
})
