import type { DashboardFilterHandle, DashboardFilterHandles } from './filters'
import type { DashboardOptionValue } from './params'

/** @deprecated Use `DashboardFilterHandle`: every param has a filter handle now. */
export type DashboardOptionsHandle<TValue extends DashboardOptionValue = DashboardOptionValue> =
  DashboardFilterHandle<unknown, TValue>

/** @deprecated Use `DashboardFilterHandles`. */
export type DashboardOptionsHandles<TParams> = DashboardFilterHandles<TParams>
