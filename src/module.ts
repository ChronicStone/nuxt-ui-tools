import { defineNuxtModule } from '@nuxt/kit'

export interface ModuleOptions {
  prefix?: string
  global?: boolean
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-ui-tools',
    configKey: 'nuxtUiTools',
  },
  defaults: {
    prefix: 'Ui',
    global: false,
  },
  setup() {},
})
