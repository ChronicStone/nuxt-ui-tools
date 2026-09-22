import { computed, shallowRef, watch } from 'vue'
import type { ComputedRef } from 'vue'

import { createEnumCodec, useQueryState } from '../../query-state'
import { isFunction } from '../../shared/utils/predicate'
import { resolveTextValue } from '../../shared/utils/render'
import type { DashboardSourceLike } from '../types'
import type { DashboardRuntimeSchema, DashboardRuntimeScopeInput } from '../types/runtime'
import {
  DASHBOARD_VIEW_URL_KEY,
  resolveDashboardScopePrefix,
  resolveDashboardViewKey,
} from '../utils/state'
import type { DashboardReadTracker } from '../utils/tracker'
import { useDashboardScope } from './use-dashboard-scope'

/**
 * Owns the view controller: the URL-synced current view (`view`, pushed to history so Back returns
 * to the previous tab) and one scope per view. A view's queries stay idle until the view is opened
 * once, then stay warm across switches.
 *
 * A view whose `enabled` condition does not hold is out of the dashboard: it has no tab, the
 * current view never resolves to it (a URL naming it falls back to the default view, else the
 * first enabled one), and its scope is inactive with every query `disabled`.
 */
export function useDashboardViews(params: {
  schema: DashboardRuntimeSchema
  root: ReturnType<typeof useDashboardScope>
  refetchInterval: ComputedRef<number>
  tracker: DashboardReadTracker
}) {
  const { schema } = params
  if (params.root.paramScope.urlKeys.includes(DASHBOARD_VIEW_URL_KEY)) {
    throw new Error(
      `[dashboard] Root param URL key "${DASHBOARD_VIEW_URL_KEY}" is reserved for the current view of "${schema.key}". Rename the param or set its \`urlKey\`.`,
    )
  }
  const keys = schema.views.map(([key]) => key)
  const stored = useQueryState({
    codec: createEnumCodec(keys),
    defaultValue: schema.defaultView ?? keys[0] ?? '',
    historyMode: 'push',
    key: resolveDashboardViewKey(schema.urlPrefix),
  })
  const rootParams = params.root.visible.values
  const conditions = new Map(
    schema.views.map(([key, input]) => [
      key,
      computed<boolean>(() => resolveViewCondition(input.enabled, { params: rootParams })),
    ]),
  )
  const isEnabled = (key: string) => conditions.get(key)?.value ?? false
  /** The view on screen: the stored one while it is enabled, else the first enabled fallback. */
  const current = computed<string>({
    get: () => {
      if (isEnabled(stored.value)) return stored.value
      const fallback = [schema.defaultView, ...keys].find((key) => key && isEnabled(key))
      return fallback ?? stored.value
    },
    set: (key) => {
      if (isEnabled(key)) stored.value = key
    },
  })
  const rootSources = new Map<string, DashboardSourceLike>(params.root.members)

  const views = schema.views.map(([key, input]) => {
    for (const shared of Object.keys(input.shared ?? {})) {
      if (!params.root.paramScope.keys.includes(shared))
        throw new Error(
          `[dashboard] View "${key}" of "${schema.key}" reads the shared param "${shared}", which the root params do not declare.`,
        )
    }
    const enabled = conditions.get(key) ?? computed<boolean>(() => true)
    const opened = shallowRef<boolean>(false)
    watch(
      () => current.value === key,
      (visible) => {
        if (visible) opened.value = true
      },
      { flush: 'sync', immediate: true },
    )
    const scope = useDashboardScope({
      active: computed<boolean>(() => opened.value && enabled.value),
      enabled,
      input,
      prefix: resolveDashboardScopePrefix(schema.urlPrefix, key),
      refetchInterval: params.refetchInterval,
      rootSources,
      schemaKey: schema.key,
      scopeKey: key,
      shared: params.root.paramScope,
      tracker: params.tracker,
    })
    const label = () => resolveTextValue(input.label, key)
    return { enabled, input, key, label, opened, scope }
  })

  return { current, keys, views }
}

function resolveViewCondition(
  condition: DashboardRuntimeScopeInput['enabled'],
  context: { params: object },
): boolean {
  if (condition === undefined) return true
  return isViewConditionGetter(condition) ? condition(context) : condition
}

function isViewConditionGetter(
  condition: boolean | ((context: { params: object }) => boolean),
): condition is (context: { params: object }) => boolean {
  return isFunction(condition)
}
