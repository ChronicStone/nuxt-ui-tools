import { createResolver, defineNuxtModule, installModule } from '@nuxt/kit'
import { breakpointsTailwind } from '@vueuse/core'
import type { ModuleOptions as ViewportOptions } from 'nuxt-viewport'

import { setupComponents } from './components'
import { setupImports } from './imports'
import type { FormUiConfig } from './runtime/form/types'
import type { DataListUiConfig } from './runtime/table/types'
import { setupTailwindCss } from './tailwindcss'

declare module '@nuxt/schema' {
  interface AppConfigInput {
    nuxtUiTools?: {
      dataList?: DataListUiConfig
      form?: FormUiConfig
    }
  }

  interface AppConfig {
    nuxtUiTools?: {
      dataList?: DataListUiConfig
      form?: FormUiConfig
    }
  }
}

export interface ModuleOptions {
  prefix?: string
  global?: boolean
}

const viewportDefaults = {
  breakpoints: breakpointsTailwind,
  defaultBreakpoints: {
    desktop: 'lg',
    mobile: 'sm',
    tablet: 'md',
  },
  fallbackBreakpoint: 'lg',
  feature: 'minWidth',
} as const

const optimizeDepsInclude = [
  '@tanstack/vue-query',
  '@tanstack/vue-virtual',
  '@vueuse/core',
  '@internationalized/date',
  'motion-v',
  'tailwind-merge',
  'vue-draggable-plus',
] as const

const publicRuntimeDomains = ['form', 'i18n', 'query-state', 'shared', 'table'] as const

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
    'nuxt-viewport': {
      version: '>=2.4.0',
    },
  },
  async setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    for (const domain of publicRuntimeDomains)
      nuxt.options.alias[`#ui-tools/${domain}`] = resolve(`./runtime/${domain}`)
    nuxt.options.vite ??= {}
    nuxt.options.vite.optimizeDeps ??= {}
    nuxt.options.vite.optimizeDeps.include = mergeOptimizeDepsInclude(
      nuxt.options.vite.optimizeDeps.include,
    )

    const viewportOptions = normalizeViewportOptions(nuxt.options.viewport)
    nuxt.options.viewport = viewportOptions
    await installModule('nuxt-viewport', viewportOptions)

    setupTailwindCss(nuxt, resolve('./runtime'))
    setupImports(resolve('./runtime'))
    setupComponents(resolve('./runtime'), options)
  },
})

function mergeViewportOptions(
  viewportOptions: Partial<ViewportOptions> | undefined,
): ViewportOptions {
  return {
    breakpoints: {
      ...viewportDefaults.breakpoints,
      ...viewportOptions?.breakpoints,
    },
    cookie: viewportOptions?.cookie ?? {},
    defaultBreakpoints: {
      ...viewportDefaults.defaultBreakpoints,
      ...viewportOptions?.defaultBreakpoints,
    },
    fallbackBreakpoint: viewportOptions?.fallbackBreakpoint ?? viewportDefaults.fallbackBreakpoint,
    feature: viewportOptions?.feature ?? viewportDefaults.feature,
  }
}

function normalizeViewportOptions(
  viewportOptions: Partial<ViewportOptions> | false | undefined,
): ViewportOptions {
  if (viewportOptions === false) return mergeViewportOptions(undefined)
  return mergeViewportOptions(viewportOptions)
}

function mergeOptimizeDepsInclude(current: string[] | undefined) {
  return [...new Set([...(current ?? []), ...optimizeDepsInclude])]
}
