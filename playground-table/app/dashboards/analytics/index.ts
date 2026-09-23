import { defineDashboardSchema } from '#ui-tools/dashboard'

import { candidatesView } from './candidates'
import { consumptionView } from './consumption'
import { operationsView } from './operations'

export { candidatesView, consumptionView, operationsView }
export { OPERATIONS_SORT_KEYS } from './operations'
export type { OperationsSortKey } from './operations'

/**
 * Tableau de bord (identity4, Atelier): three self-contained views, one file each. They all declare
 * `year` the same way, so it is one filter that survives a tab change.
 */
export function analyticsSchema() {
  return defineDashboardSchema({
    key: 'analytics',
    views: {
      consumption: consumptionView(),
      candidates: candidatesView(),
      operations: operationsView(),
    },
  })
}
