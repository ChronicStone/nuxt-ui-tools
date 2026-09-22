import { defineDashboardSchema } from '#ui-tools/dashboard'

import { candidatesView } from './candidates'
import { consumptionView } from './consumption'
import { periodFilters } from './filters'

/**
 * The analytics dashboard from the identity4 design exploration, split the way an app would: shared
 * filters, one file per view, and this schema tying them together. Tab components read their view
 * with `useDashboardView`.
 */
export const analyticsDashboard = defineDashboardSchema({
  key: 'analytics',
  params: periodFilters,
  views: { consumption: consumptionView, candidates: candidatesView },
})
