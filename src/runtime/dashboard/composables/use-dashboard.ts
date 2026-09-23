import {
  computed,
  effectScope,
  getCurrentInstance,
  markRaw,
  onScopeDispose,
  shallowRef,
  watch,
} from 'vue'
import type { EffectScope } from 'vue'

import { useUiToolsLocale } from '../../i18n/use-locale'
import { numberCodec, useQueryState } from '../../query-state'
import type { DashboardApi, DashboardSchemaLike, DashboardSchemaOf } from '../types'
import type { DashboardEnvironment, DashboardLocale } from '../utils/environment'
import { resolveDashboardRuntimeSchema } from '../utils/schema'
import {
  DASHBOARD_REFRESH_URL_KEY,
  resolveDashboardRefreshKey,
  resolveDashboardScopePrefix,
} from '../utils/state'
import { createDashboardReadTracker } from '../utils/tracker'
import { useDashboardApi } from './use-dashboard-api'
import { provideDashboard } from './use-dashboard-context'
import { useDashboardScope } from './use-dashboard-scope'
import { useDashboardViews } from './use-dashboard-views'

/**
 * Instantiates a dashboard. Call it once in `<script setup>` with a schema, or with a function
 * returning one: the function runs right away, and again whenever something it reads changes (the
 * route's id, the workspace), rebuilding the dashboard for the new input behind the same object.
 *
 * The returned object has no refs: `dashboard.filters.year`, `dashboard.revenue.data`,
 * `dashboard.state` are plain reads, filters are `v-model` targets, controls drive pickers, and
 * every query / derived value can be bound to a block with `:source="dashboard.revenue"`.
 * Descendant components get it with `injectDashboard(schema)`, and a view with `useDashboardView`.
 *
 * A schema function runs again outside component setup: call app-level composables in it
 * (`useNuxtApp()`, a store, `useRoute()`), not `useI18n()` or lifecycle hooks.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const route = useRoute()
 * const account = useDashboard(() => accountSchema({ accountId: String(route.params.id) }))
 * </script>
 *
 * <template>
 *   <UiDashboardPage :dashboard="account" title="Account">
 *     <template #activity><AccountActivity /></template>
 *   </UiDashboardPage>
 * </template>
 * ```
 */
export function useDashboard<
  const TSource extends DashboardSchemaLike | (() => DashboardSchemaLike),
>(source: TSource): DashboardApi<DashboardSchemaOf<TSource>>
export function useDashboard(source: DashboardSchemaLike | (() => DashboardSchemaLike)) {
  const locale = useUiToolsLocale()
  if (typeof source !== 'function') {
    const runtime = createDashboardRuntime(source, locale)
    provideDashboard({
      api: runtime.api,
      current: () => runtime.current(),
      findView: (declaration) => runtime.findView(declaration),
      schema: () => source,
      source,
      view: (key) => runtime.views.get(key),
    })
    return runtime.api
  }

  // Rebuilds run from the watcher, outside setup: the app context keeps `inject()` working in the
  // schema function and in the queries (the router, the query client).
  const app = getCurrentInstance()?.appContext.app
  const withContext = <TResult>(run: () => TResult) => (app ? app.runWithContext(run) : run())
  const schema = computed(() => withContext(source))
  let scope: EffectScope = effectScope(true)
  const current = shallowRef(build(scope, schema.value))

  function build(owner: EffectScope, next: DashboardSchemaLike) {
    const runtime = withContext(() => owner.run(() => createDashboardRuntime(next, locale)))
    if (!runtime) throw new Error('[dashboard] The dashboard scope stopped while building.')
    return runtime
  }

  // The previous dashboard stops once the next one runs, so shared cache entries never drop.
  watch(schema, (next) => {
    const previous = scope
    scope = effectScope(true)
    current.value = build(scope, next)
    previous.stop()
  })
  onScopeDispose(() => scope.stop())

  const views = new Map<string, object>()
  const view = (key: string) => {
    let handle = views.get(key)
    if (!handle) {
      handle = createStableFacade(() => current.value.views.get(key))
      views.set(key, handle)
    }
    return handle
  }
  const api = createStableFacade(
    () => current.value.api,
    (key) => (current.value.views.has(key) ? view(key) : undefined),
  )
  provideDashboard({
    api,
    current: () => current.value.current(),
    findView: (declaration) => current.value.findView(declaration),
    schema: () => schema.value,
    source,
    view: (key) => (current.value.views.has(key) ? view(key) : undefined),
  })
  return api
}

/** Builds one dashboard from one schema: its root and view scopes, and the facade over them. */
function createDashboardRuntime(schema: DashboardSchemaLike, locale: DashboardLocale) {
  const runtime = resolveDashboardRuntimeSchema(schema)
  const tracker = createDashboardReadTracker()
  const environment: DashboardEnvironment = { locale, registry: new Map() }
  // Auto-refresh interval, in seconds: URL-synced, so a wall screen keeps polling after a reload.
  const autoRefresh = useQueryState({
    codec: numberCodec,
    defaultValue: Math.max(0, runtime.autoRefresh ?? 0),
    historyMode: 'replace',
    key: resolveDashboardRefreshKey(runtime.urlPrefix),
  })
  const refetchInterval = computed<number>(() =>
    Number.isFinite(autoRefresh.value) && autoRefresh.value > 0 ? autoRefresh.value * 1000 : 0,
  )
  const root = useDashboardScope({
    active: computed<boolean>(() => true),
    environment,
    input: runtime,
    prefix: resolveDashboardScopePrefix(runtime.urlPrefix),
    refetchInterval,
    schemaKey: runtime.key,
    scopeKey: '',
    tracker,
  })
  const views =
    runtime.views.length > 0
      ? useDashboardViews({ environment, refetchInterval, root, schema: runtime, tracker })
      : null
  for (const scope of [root, ...(views?.views.map((view) => view.scope) ?? [])]) {
    if (scope.filterScope.urlKeys.includes(DASHBOARD_REFRESH_URL_KEY))
      throw new Error(
        `[dashboard] A filter of "${runtime.key}" uses the URL key "${DASHBOARD_REFRESH_URL_KEY}", which holds the auto-refresh interval. Rename the filter or set its \`urlKey\`.`,
      )
  }
  const { api, handles } = useDashboardApi({ autoRefresh, root, schema, views })
  const declarations = new Map<object, string>(runtime.views.map(([key, input]) => [input, key]))

  return {
    api,
    current: () => views?.current.value,
    findView: (declaration: object) => declarations.get(declaration),
    views: handles,
  }
}

/**
 * An object that reads and writes through to whatever `read()` returns now: the dashboard (or one
 * view) of the current build. Reads are tracked, so templates follow a rebuild. `member` overrides
 * some members with facades of their own, which keeps view handles stable too.
 */
function createStableFacade(
  read: () => object | undefined,
  member?: (key: string) => object | undefined,
): object {
  const target = () => read() ?? {}
  return markRaw(
    new Proxy(Object.create(null), {
      get: (_, key) =>
        (typeof key === 'string' ? member?.(key) : undefined) ?? Reflect.get(target(), key),
      getOwnPropertyDescriptor: (_, key) => {
        const descriptor = Reflect.getOwnPropertyDescriptor(target(), key)
        return descriptor ? { ...descriptor, configurable: true } : undefined
      },
      has: (_, key) => Reflect.has(target(), key),
      ownKeys: () => Reflect.ownKeys(target()),
      set: (_, key, value) => Reflect.set(target(), key, value),
    }),
  )
}
