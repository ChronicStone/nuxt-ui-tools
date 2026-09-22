import { computed } from 'vue'

import { numberCodec, useQueryState } from '../../query-state'
import type { DashboardApi, DashboardSchemaLike } from '../types'
import { resolveDashboardRuntimeSchema } from '../utils/schema'
import {
  DASHBOARD_REFRESH_URL_KEY,
  resolveDashboardRefreshKey,
  resolveDashboardScopePrefix,
} from '../utils/state'
import { createDashboardReadTracker } from '../utils/tracker'
import { useDashboardApi } from './use-dashboard-api'
import { provideDashboardInstances } from './use-dashboard-context'
import { useDashboardScope } from './use-dashboard-scope'
import { useDashboardViews } from './use-dashboard-views'

/**
 * Instantiates a dashboard schema. Call it once in `<script setup>`; every query and URL binding is
 * created synchronously here, so hook order is stable. Descendant components get the same
 * dashboard with `injectDashboard(schema)`, and a view handle with `useDashboardView(view)`.
 *
 * The returned object has no refs: `dashboard.params.year`, `dashboard.revenue.data`,
 * `dashboard.state` are plain reads, params are `v-model` targets, filters drive controls, and every
 * query / derived value can be bound to a block with `:source="dashboard.revenue"`.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const dashboard = useDashboard(salesDashboard)
 * </script>
 *
 * <template>
 *   <UiDashboardFilters :dashboard />
 *   <UiDashboardGrid>
 *     <UiDashboardStat :source="dashboard.summary" label="Revenue" :value="(d) => d.revenue" />
 *   </UiDashboardGrid>
 * </template>
 * ```
 */
export function useDashboard<const TSchema extends DashboardSchemaLike>(
  schema: TSchema,
): DashboardApi<TSchema> {
  const runtime = resolveDashboardRuntimeSchema(schema)
  const tracker = createDashboardReadTracker()
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
    input: runtime,
    prefix: resolveDashboardScopePrefix(runtime.urlPrefix),
    refetchInterval,
    schemaKey: runtime.key,
    scopeKey: '',
    tracker,
  })
  if (root.paramScope.urlKeys.includes(DASHBOARD_REFRESH_URL_KEY)) {
    throw new Error(
      `[dashboard] Root param URL key "${DASHBOARD_REFRESH_URL_KEY}" is reserved for the auto-refresh interval of "${runtime.key}". Rename the param or set its \`urlKey\`.`,
    )
  }
  const views =
    runtime.views.length > 0
      ? useDashboardViews({ refetchInterval, root, schema: runtime, tracker })
      : null
  const { api, handles } = useDashboardApi({ autoRefresh, root, schema, views })
  provideDashboardInstances([[schema, api], ...handles])

  // SAFETY: the facade is assembled from this schema by the same runtime that the schema types
  // describe; `DashboardApi<TSchema>` is the precise view of those runtime members.
  return api as DashboardApi<TSchema>
}
