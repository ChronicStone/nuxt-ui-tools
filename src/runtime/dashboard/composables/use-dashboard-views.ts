import { computed, shallowRef, watch } from 'vue'
import type { ComputedRef } from 'vue'

import { createEnumCodec, useQueryState } from '../../query-state'
import { resolveTextValue } from '../../shared/utils/render'
import type { DashboardSourceLike } from '../types'
import type { DashboardRuntimeSchema } from '../types/runtime'
import type { DashboardEnvironment } from '../utils/environment'
import {
  DASHBOARD_VIEW_URL_KEY,
  resolveDashboardCondition,
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
  environment: DashboardEnvironment
}) {
  const { schema } = params
  assertDashboardViewUrlKeys('', params.root.filterScope.urlKeys)
  const keys = schema.views.map(([key]) => key)
  const stored = useQueryState({
    codec: createEnumCodec(keys),
    defaultValue: schema.defaultView ?? keys[0] ?? '',
    historyMode: 'push',
    key: resolveDashboardViewKey(schema.urlPrefix),
  })
  const conditions = new Map(
    schema.views.map(([key, input]) => [
      key,
      computed<boolean>(() => resolveDashboardCondition(input.enabled)),
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
      environment: params.environment,
      input,
      prefix: resolveDashboardScopePrefix(schema.urlPrefix),
      refetchInterval: params.refetchInterval,
      rootSources,
      schemaKey: schema.key,
      scopeKey: key,
      tracker: params.tracker,
    })
    assertDashboardViewUrlKeys(key, scope.filterScope.urlKeys)
    const label = () => resolveTextValue(input.label, key)
    return { enabled, input, key, label, opened, scope }
  })

  return { current, keys, views }
}

/** No filter may take the URL key of the current view. */
export function assertDashboardViewUrlKeys(owner: string, urlKeys: readonly string[]) {
  if (urlKeys.includes(DASHBOARD_VIEW_URL_KEY))
    throw new Error(
      `[dashboard] A filter of ${owner ? `view "${owner}"` : 'the dashboard root'} uses the URL key "${DASHBOARD_VIEW_URL_KEY}", which holds the current view. Rename the filter or set its \`urlKey\`.`,
    )
}
