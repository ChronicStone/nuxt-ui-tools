import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, type Component, type VNodeChild } from 'vue'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'

import DataListRoot from '#ui-tools/table/components/data-list/DataListRoot.vue'
import { useTable } from '#ui-tools/table/composables/use-table'
import type { TableInternals } from '#ui-tools/table/composables/use-table-internals'
import type { DataListControlSize, DataListDensity, DataListUiConfig } from '#ui-tools/table/types'

import { setAppConfig, setBreakpoint, type BreakpointKey } from './nuxt-state'

export interface MountOptions {
  schema: unknown
  render?: () => VNodeChild
  component?: Component
  props?: Record<string, unknown>
  ui?: DataListUiConfig
  density?: DataListDensity
  size?: DataListControlSize
  query?: Record<string, string>
  breakpoint?: BreakpointKey
  appConfig?: Record<string, unknown>
  start?: boolean
  settle?: boolean
}

export interface Harness {
  wrapper: VueWrapper
  router: Router
  queryClient: QueryClient
  internals: TableInternals
  table: ReturnType<typeof useTable>
  flush: (rounds?: number) => Promise<void>
  until: (predicate: () => boolean, timeout?: number) => Promise<void>
  query: () => Record<string, unknown>
  unmount: () => void
}

export async function mountDataList(options: MountOptions): Promise<Harness> {
  setBreakpoint(options.breakpoint ?? 'xl')
  setAppConfig(options.appConfig ?? {})
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: { render: () => h('div') } }],
  })
  await router.push({ path: '/', query: options.query ?? {} })
  await router.isReady()
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  })
  let table!: ReturnType<typeof useTable>
  const Host = defineComponent({
    name: 'Host',
    setup() {
      table = useTable(options.schema)
      return () =>
        h(
          DataListRoot,
          { table, ui: options.ui, density: options.density, size: options.size },
          {
            default: () =>
              options.render
                ? options.render()
                : options.component
                  ? h(options.component, options.props)
                  : h('div', { 'data-host': '' }),
          },
        )
    },
  })
  const wrapper = mount(Host, {
    attachTo: document.body,
    global: { plugins: [router, [VueQueryPlugin, { queryClient }]] },
  })
  const internals = table.__internals
  if (options.start !== false) internals.startup.start()

  async function flush(rounds = 3) {
    for (let index = 0; index < rounds; index++) {
      await nextTick()
      await new Promise((resolve) => setTimeout(resolve, 0))
    }
    await nextTick()
  }

  async function until(predicate: () => boolean, timeout = 2000) {
    const started = Date.now()
    while (!predicate()) {
      if (Date.now() - started > timeout) throw new Error('until(): timed out')
      await flush(1)
    }
    await nextTick()
  }

  if (options.settle !== false) await flush()

  return {
    wrapper,
    router,
    queryClient,
    internals,
    table,
    flush,
    until,
    query: () => router.currentRoute.value.query as Record<string, unknown>,
    unmount: () => wrapper.unmount(),
  }
}

export async function mountLoaded(options: MountOptions) {
  const harness = await mountDataList(options)
  await harness.until(() => harness.internals.queryContent.status.value.initialized)
  return harness
}

export function rows<T = Record<string, unknown>>(harness: Harness) {
  return harness.internals.queryContent.data.value.rows as T[]
}

export function rawRows<T = Record<string, unknown>>(harness: Harness) {
  return harness.internals.queryContent.rawData.value.rows as T[]
}

export function texts(wrapper: { findAll: (selector: string) => Array<{ text: () => string }> }, selector: string) {
  return wrapper.findAll(selector).map((node) => node.text().trim())
}
