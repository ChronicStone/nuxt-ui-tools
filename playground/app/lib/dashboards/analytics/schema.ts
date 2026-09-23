import { defineDashboardSchema } from '#ui-tools/dashboard'

import { candidatesView } from './candidates'
import { consumptionView } from './consumption'

/**
 * The analytics dashboard from the identity4 design exploration, split the way an app would: one
 * file per view, each declaring its own filters inline, and this function tying them together.
 * Both views declare `year`, so the year survives a tab change. Tab components read their view
 * with `useDashboardView`.
 */
export function analyticsSchema() {
  return defineDashboardSchema({
    key: 'analytics',
    views: { consumption: consumptionView(), candidates: candidatesView() },
  })
}
