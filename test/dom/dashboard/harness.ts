import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import type { VNodeChild } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { Router } from 'vue-router'

import { useDashboard } from '#ui-tools/dashboard'
import type { DashboardSchemaLike, InferDashboard } from '#ui-tools/dashboard'

import { setAppConfig, setBreakpoint } from '../nuxt-state'
import type { BreakpointKey } from '../nuxt-state'

export interface DashboardHarness<TSchema> {
  dashboard: InferDashboard<TSchema>
  wrapper: VueWrapper
  router: Router
  queryClient: QueryClient
  flush: (rounds?: number) => Promise<void>
  until: (predicate: () => boolean, timeout?: number) => Promise<void>
  query: () => Record<string, unknown>
  /** Query keys the query client has seen, excluding idle placeholders. */
  fetchedKeys: () => string[]
}

export async function mountDashboard<
  const TSchema extends DashboardSchemaLike | (() => DashboardSchemaLike),
>(options: {
  /** A schema, or a function returning one (run again when what it reads changes). */
  schema: TSchema
  query?: Record<string, string>
  breakpoint?: BreakpointKey
  render?: (dashboard: InferDashboard<TSchema>) => VNodeChild
}): Promise<DashboardHarness<TSchema>> {
  setBreakpoint(options.breakpoint ?? 'xl')
  setAppConfig({})
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ component: { render: () => h('div') }, path: '/' }],
  })
  await router.push({ path: '/', query: options.query ?? {} })
  await router.isReady()
  const queryClient = new QueryClient({
    defaultOptions: { queries: { gcTime: 0, retry: false } },
  })

  let dashboard!: InferDashboard<TSchema>
  const Host = defineComponent({
    name: 'DashboardHost',
    setup() {
      // SAFETY: `useDashboard` returns `DashboardApi<DashboardSchemaOf<TSchema>>`, which is what
      // `InferDashboard<TSchema>` names; TypeScript cannot relate the two through the generic.
      dashboard = useDashboard(options.schema) as InferDashboard<TSchema>
      return () => h('div', { 'data-host': '' }, options.render?.(dashboard) ?? [])
    },
  })
  const wrapper = mount(Host, {
    attachTo: document.body,
    global: { plugins: [router, [VueQueryPlugin, { queryClient }]] },
  })

  async function until(predicate: () => boolean, timeout = 2000) {
    const started = Date.now()
    while (!predicate()) {
      if (Date.now() - started > timeout) throw new Error('until(): timed out')
      await flush(1)
    }
  }

  await flush()

  return {
    dashboard,
    fetchedKeys: () =>
      queryClient
        .getQueryCache()
        .findAll()
        .map((query) => JSON.stringify(query.queryKey))
        .filter((key) => !key.includes('"idle"')),
    flush,
    query: () => ({ ...router.currentRoute.value.query }),
    queryClient,
    router,
    until,
    wrapper,
  }
}

async function flush(rounds = 3) {
  for (let index = 0; index < rounds; index += 1) {
    await nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))
  }
  await nextTick()
}

/** A controllable async source: resolve or reject each call from the test. */
export function deferredSource<TValue>() {
  const calls: {
    args: unknown[]
    resolve: (value: TValue) => void
    reject: (error: Error) => void
  }[] = []
  const fn = (...args: unknown[]) =>
    new Promise<TValue>((resolve, reject) => {
      calls.push({ args, reject, resolve })
    })
  return { calls, fn }
}
