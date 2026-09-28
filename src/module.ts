import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

import {
  addPlugin,
  addVitePlugin,
  createResolver,
  defineNuxtModule,
  installModule,
} from '@nuxt/kit'
import type { NuxtOptions, VueTSConfig } from '@nuxt/schema'
import { breakpointsTailwind } from '@vueuse/core'
import type { ModuleOptions as ViewportOptions } from 'nuxt-viewport'
import typescript from 'typescript'

import { setupComponents } from './components'
import { setupImports } from './imports'
import { transformQueryPrefetchMacro } from './internals/query-prefetch-transform'
import type { DashboardUiConfig } from './runtime/dashboard/types'
import type { FormUiConfig } from './runtime/form/types'
import type { DataListUiConfig } from './runtime/table/types'
import { setupTailwindCss } from './tailwindcss'

declare module '@nuxt/schema' {
  interface NuxtOptions {
    viewport: ViewportOptions | false
  }

  interface AppConfigInput {
    nuxtUiTools?: {
      dashboard?: DashboardUiConfig
      dataList?: DataListUiConfig
      form?: FormUiConfig
    }
  }

  interface AppConfig {
    nuxtUiTools?: {
      dashboard?: DashboardUiConfig
      dataList?: DataListUiConfig
      form?: FormUiConfig
    }
  }
}

export interface ModuleOptions {
  prefix?: string
  global?: boolean
  /** Ships the thin overlay-style scrollbar stylesheet applied to every scroll container. Defaults to `true`. */
  scrollbars?: boolean
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

const publicRuntimeDomains = [
  'dashboard',
  'file-preview',
  'form',
  'i18n',
  'query-prefetch',
  'query-state',
  'shared',
  'table',
] as const
const require = createRequire(import.meta.url)
const cookieEsmPath = join(dirname(require.resolve('cookiejs/package.json')), 'dist/cookie.esm.js')

export default defineNuxtModule<ModuleOptions>({
  defaults: {
    global: false,
    prefix: 'Ui',
  },
  meta: {
    compatibility: {
      nuxt: '>=4.4.0',
    },
    configKey: 'nuxtUiTools',
    docs: 'https://ui.nuxt.com/docs/getting-started/installation/nuxt',
    name: 'nuxt-ui-tools',
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
    const consumerRequire = createRequire(join(nuxt.options.rootDir, 'package.json'))
    const nuxtUiComponentsDir = dirname(consumerRequire.resolve('@nuxt/ui/components/Button.vue'))
    const nuxtUiRuntimeDir = dirname(nuxtUiComponentsDir)
    const nuxtUiRequire = createRequire(join(nuxtUiRuntimeDir, 'package.json'))
    const internationalizedDateDir = dirname(
      dirname(nuxtUiRequire.resolve('@internationalized/date')),
    )

    for (const domain of publicRuntimeDomains) {
      nuxt.options.alias[`#ui-tools/${domain}`] = resolve(`./runtime/${domain}`)
    }
    nuxt.options.alias['@nuxt/ui/components'] ??= nuxtUiComponentsDir
    nuxt.options.alias['@nuxt/ui/composables'] ??= join(nuxtUiRuntimeDir, 'composables')
    nuxt.options.alias['@nuxt/ui/runtime'] ??= nuxtUiRuntimeDir
    nuxt.options.alias['@internationalized/date'] ??= internationalizedDateDir
    nuxt.options.typescript.tsConfig ??= {}
    nuxt.options.typescript.sharedTsConfig ??= {}
    nuxt.options.typescript.nodeTsConfig ??= {}
    setupJsxCompilerOptions(nuxt.options.typescript.tsConfig)
    setupJsxCompilerOptions(nuxt.options.typescript.sharedTsConfig)
    setupJsxCompilerOptions(nuxt.options.typescript.nodeTsConfig)
    nuxt.options.vite ??= {}
    nuxt.options.vite.resolve ??= {}
    nuxt.options.vite.resolve.dedupe = [
      ...new Set([...(nuxt.options.vite.resolve.dedupe ?? []), '@nuxt/ui']),
    ]
    nuxt.options.alias.cookiejs ??= cookieEsmPath
    keepServerPrefetchInClient(nuxt.options)
    bundleTableEngines(nuxt.options)

    const viewportOptions = normalizeViewportOptions(nuxt.options.viewport)
    nuxt.options.viewport = viewportOptions
    await installModule('nuxt-viewport', viewportOptions)

    setupTailwindCss(nuxt, resolve('./runtime'))
    nuxt.options.css.push(resolve('./runtime/shared/styles/tokens.css'))
    if (options.scrollbars !== false) {
      nuxt.options.css.push(resolve('./runtime/shared/styles/scrollbars.css'))
    }
    setupImports(resolve('./runtime'))
    setupComponents(resolve('./runtime'), options)
    addPlugin(resolve('./runtime/query-prefetch/plugins/link-prefetch.client'))
    addPlugin(resolve('./runtime/form/plugins/form-api'))
    addPlugin(resolve('./runtime/file-preview/plugins/file-preview-api'))
    addVitePlugin({
      enforce: 'pre',
      name: 'nuxt-ui-tools:query-prefetch-macro',
      transform(code, id) {
        const path = id.split('?', 1)[0] ?? id
        if (!path.endsWith('.vue') || !/[\\/]pages[\\/]/u.test(path)) {
          return
        }

        const transformed = transformQueryPrefetchMacro(typescript, code, id)
        if (!transformed || transformed === code) {
          return
        }
        return { code: transformed, map: null }
      },
    })
  },
})

function mergeViewportOptions(viewportOptions?: Partial<ViewportOptions>): ViewportOptions {
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
  if (viewportOptions === false) {
    return mergeViewportOptions()
  }
  return mergeViewportOptions(viewportOptions)
}

/**
 * Keeps `onServerPrefetch` in client builds, which Nuxt removes by default. Vue gives every
 * component that registers the hook its own `useId` scope, so after any such component, such as
 * each Nuxt Icon, the ids the browser generates while hydrating would otherwise differ from the
 * ids the server rendered, and labels, descriptions, and popups would point at the wrong elements.
 */
function keepServerPrefetchInClient(options: NuxtOptions) {
  const composables = options.optimization.treeShake.composables.client
  const vue = composables.vue
  if (Array.isArray(vue)) {
    composables.vue = vue.filter((name) => name !== 'onServerPrefetch')
  }
}

/**
 * Bundles TanStack Table into the server build. The tables of this module use its version 9 while
 * Nuxt UI's table uses version 8; bundling resolves each import from its importer, as the client
 * build does, while an external import is resolved once from the server chunks, where package
 * managers with isolated installs only expose one of the two versions.
 */
function bundleTableEngines(options: NuxtOptions) {
  options.vite.ssr ??= {}
  const current = options.vite.ssr.noExternal
  if (current === true) {
    return
  }
  const listed = Array.isArray(current) ? current : current === undefined ? [] : [current]
  options.vite.ssr.noExternal = [...listed, '@tanstack/vue-table', '@tanstack/table-core']
}

function setupJsxCompilerOptions(config: VueTSConfig) {
  config.compilerOptions ??= {}
  config.compilerOptions.jsx = 'preserve'
  config.compilerOptions.jsxImportSource = 'vue'
}
