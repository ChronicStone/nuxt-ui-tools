import { markRaw } from 'vue'
import type { WritableComputedRef } from 'vue'

import type { DashboardResourceState, DashboardSchemaLike } from '../types'
import {
  combineDashboardStates,
  refreshDashboardSources,
  resolveDashboardUpdatedAt,
} from '../utils/state'
import type { useDashboardScope } from './use-dashboard-scope'
import type { useDashboardViews } from './use-dashboard-views'

/**
 * Facade only: projects the owning scopes into the public dashboard object. Every runtime member is
 * a getter over a ref owned elsewhere, so templates read plain values and `v-model` writes through.
 *
 * Returns the facade and the view handles by view key.
 */
export function useDashboardApi(params: {
  schema: DashboardSchemaLike
  /** Auto-refresh interval in seconds (URL-synced). */
  autoRefresh: WritableComputedRef<number>
  root: ReturnType<typeof useDashboardScope>
  views: ReturnType<typeof useDashboardViews> | null
}) {
  const { root, views } = params
  const api: Record<string, unknown> = Object.fromEntries(root.members)
  const handles = new Map<string, object>()

  for (const view of views?.views ?? []) {
    const handle: Record<string, unknown> = Object.fromEntries(view.scope.members)
    Object.defineProperties(handle, {
      ...scopeMembers(view.scope),
      view: {
        enumerable: true,
        value: markRaw({
          get active() {
            return views?.current.value === view.key
          },
          get enabled() {
            return view.enabled.value
          },
          key: view.key,
          get label() {
            return view.label()
          },
          get opened() {
            return view.opened.value
          },
        }),
      },
    })
    const facade = markRaw(handle)
    api[view.key] = facade
    handles.set(view.key, facade)
  }

  const openedScopes = () => [
    root,
    ...(views?.views.filter((view) => view.opened.value).map((view) => view.scope) ?? []),
  ]
  const currentView = () => views?.views.find((view) => view.key === views.current.value)
  // What is on screen: the root and the current view.
  const visibleScopes = () => {
    const current = currentView()
    return current ? [root, current.scope] : [root]
  }
  const visibleFilters = () => visibleScopes().map((scope) => scope.filterScope)

  Object.defineProperties(api, {
    ...scopeMembers(root),
    autoRefresh: {
      enumerable: true,
      get: () => params.autoRefresh.value,
      set: (seconds: number) => {
        params.autoRefresh.value = Number.isFinite(seconds) ? Math.max(0, Math.round(seconds)) : 0
      },
    },
    filtered: {
      enumerable: true,
      get: () => visibleFilters().some((filters) => filters.changed()),
    },
    refresh: { enumerable: true, value: () => refreshDashboardSources(openedScopes()) },
    refreshing: {
      enumerable: true,
      get: () => openedScopes().some((scope) => scope.refreshing.value),
    },
    resetFilters: {
      enumerable: true,
      value: () => {
        for (const filters of visibleFilters()) filters.reset()
      },
    },
    schema: { enumerable: true, value: params.schema },
    state: {
      enumerable: true,
      get: (): DashboardResourceState =>
        combineDashboardStates(visibleScopes().map((scope) => scope.state.value)),
    },
    updatedAt: {
      enumerable: true,
      get: () => resolveDashboardUpdatedAt(visibleScopes().map((scope) => scope.updatedAt.value)),
    },
  })

  if (views) {
    Object.defineProperty(api, 'view', {
      enumerable: true,
      value: markRaw({
        get current() {
          return views.current.value
        },
        set current(next: string) {
          views.current.value = next
        },
        get items() {
          return views.views.flatMap((view) =>
            view.enabled.value ? [{ label: view.label(), value: view.key }] : [],
          )
        },
      }),
    })
  }

  return { api: markRaw(api), handles }
}

function scopeMembers(scope: ReturnType<typeof useDashboardScope>): PropertyDescriptorMap {
  const { filterScope } = scope
  return {
    controls: { enumerable: true, value: filterScope.controls },
    filtered: { enumerable: true, get: () => filterScope.changed() },
    filters: { enumerable: true, value: filterScope.values },
    refresh: { enumerable: true, value: scope.refresh },
    refreshing: { enumerable: true, get: () => scope.refreshing.value },
    resetFilters: { enumerable: true, value: () => filterScope.reset() },
    state: { enumerable: true, get: () => scope.state.value },
    updatedAt: { enumerable: true, get: () => scope.updatedAt.value },
  }
}
