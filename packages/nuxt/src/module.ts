import { defineNuxtModule } from '@nuxt/kit'

export interface NuxtUiToolsModuleOptions {
  prefix?: string
  global?: boolean
}

export default defineNuxtModule<NuxtUiToolsModuleOptions>({
  meta: {
    name: '@nuxt-ui-tools/nuxt',
    configKey: 'nuxtUiTools',
  },
  defaults: {
    prefix: 'Ui',
    global: false,
  },
  setup() {},
})
