import { computed } from 'vue'

import type { DashboardApi, DashboardSchemaLike } from '../types'
import { resolveDashboardRuntimeSchema } from '../utils/schema'
import { resolveDashboardScopePrefix } from '../utils/state'
import { createDashboardReadTracker } from '../utils/tracker'
import { useDashboardApi } from './use-dashboard-api'
import { useDashboardScope } from './use-dashboard-scope'
import { useDashboardViews } from './use-dashboard-views'

/**
 * Instantiates a dashboard schema. Call it once in `<script setup>`; every query and URL binding is
 * created synchronously here, so hook order is stable.
 *
 * The returned object has no refs: `dashboard.params.year`, `dashboard.revenue.data`,
 * `dashboard.state` are plain reads, params are `v-model` targets, and every query / derived value
 * can be bound to a block with `:source="dashboard.revenue"`.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const dashboard = useDashboard(salesDashboard)
 * </script>
 *
 * <template>
 *   <USelect v-model="dashboard.params.period" v-bind="dashboard.options.period.menu" />
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
  const root = useDashboardScope({
    active: computed<boolean>(() => true),
    input: runtime,
    prefix: resolveDashboardScopePrefix(runtime.urlPrefix),
    schemaKey: runtime.key,
    scopeKey: '',
    tracker,
  })
  const views =
    runtime.views.length > 0 ? useDashboardViews({ root, schema: runtime, tracker }) : null
  const api = useDashboardApi({ root, schema, views })

  // SAFETY: the facade is assembled from this schema by the same runtime that the schema types
  // describe; `DashboardApi<TSchema>` is the precise view of those runtime members.
  return api as DashboardApi<TSchema>
}
