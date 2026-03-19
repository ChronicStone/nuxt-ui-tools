import { addComponentsDir, createResolver, defineNuxtModule } from '@nuxt/kit'

import { setupTailwindCss } from './tailwindcss'

export interface ModuleOptions {
  prefix?: string
  global?: boolean
}

export default defineNuxtModule<ModuleOptions>({
  defaults: {
    prefix: 'Ui',
    global: false,
  },
  meta: {
    name: 'nuxt-ui-tools',
    configKey: 'nuxtUiTools',
    docs: 'https://ui.nuxt.com/docs/getting-started/installation/nuxt',
    compatibility: {
      nuxt: '>=4.4.0',
    },
  },
  moduleDependencies: {
    '@nuxt/ui': {
      version: '>=4.5.1',
    },
  },
  async setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)
    setupTailwindCss(nuxt, resolve('./runtime'))

    addComponentsDir({
      path: resolve('./runtime/table/components'),
      pathPrefix: false,
      prefix: options.prefix,
      global: options.global,
      ignore: ['drawers/**', 'filters/**', 'grid/**', 'layout/**', 'table/**', 'utils/**'],
    })
  },
})
