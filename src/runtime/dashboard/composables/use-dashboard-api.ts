import { markRaw } from 'vue'

import type { DashboardResourceState, DashboardSchemaLike } from '../types'
import { combineDashboardStates, refreshDashboardSources } from '../utils/state'
import type { useDashboardScope } from './use-dashboard-scope'
import type { useDashboardViews } from './use-dashboard-views'

/**
 * Facade only: projects the owning scopes into the public dashboard object. Every runtime member is
 * a getter over a ref owned elsewhere, so templates read plain values and `v-model` writes through.
 */
export function useDashboardApi(params: {
  schema: DashboardSchemaLike
  root: ReturnType<typeof useDashboardScope>
  views: ReturnType<typeof useDashboardViews> | null
}): object {
  const { root, views } = params
  const api: Record<string, unknown> = Object.fromEntries(root.members)

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
    api[view.key] = markRaw(handle)
  }

  const openedScopes = () => [
    root,
    ...(views?.views.filter((view) => view.opened.value).map((view) => view.scope) ?? []),
  ]

  Object.defineProperties(api, {
    ...scopeMembers(root),
    refresh: { enumerable: true, value: () => refreshDashboardSources(openedScopes()) },
    refreshing: {
      enumerable: true,
      get: () => openedScopes().some((scope) => scope.refreshing.value),
    },
    schema: { enumerable: true, value: params.schema },
    state: {
      enumerable: true,
      get: (): DashboardResourceState => {
        const current = views?.views.find((view) => view.key === views.current.value)
        return combineDashboardStates(
          current ? [root.state.value, current.scope.state.value] : [root.state.value],
        )
      },
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
          return views.views.map((view) => ({ label: view.label(), value: view.key }))
        },
      }),
    })
  }

  return markRaw(api)
}

function scopeMembers(scope: ReturnType<typeof useDashboardScope>): PropertyDescriptorMap {
  return {
    options: { enumerable: true, value: scope.paramScope.options },
    params: { enumerable: true, value: scope.paramScope.values },
    refresh: { enumerable: true, value: scope.refresh },
    refreshing: { enumerable: true, get: () => scope.refreshing.value },
    state: { enumerable: true, get: () => scope.state.value },
  }
}
