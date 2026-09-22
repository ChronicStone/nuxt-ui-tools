import { getCurrentInstance, inject, provide } from 'vue'
import type { InjectionKey } from 'vue'

import type {
  DashboardApi,
  DashboardSchemaLike,
  DashboardViewLike,
  InferDashboardView,
} from '../types'

interface DashboardContext {
  /** Dashboards and view handles provided by ancestors, by the object they were declared with. */
  instances: ReadonlyMap<object, object>
}

const dashboardContextKey: InjectionKey<DashboardContext> = Symbol('nuxt-ui-tools.dashboard')

/** Makes a dashboard and its view handles available to descendant components. */
export function provideDashboardInstances(entries: Iterable<readonly [object, object]>) {
  if (!getCurrentInstance()) return
  const parent = inject(dashboardContextKey, null)
  provide(dashboardContextKey, {
    instances: new Map([...(parent?.instances ?? []), ...entries]),
  })
}

function findDashboardInstance(declaration: object) {
  return inject(dashboardContextKey, null)?.instances.get(declaration)
}

/**
 * Returns the dashboard an ancestor component created with `useDashboard(schema)`, fully typed, so
 * nested components read it without props.
 *
 * @example
 * ```ts
 * const dashboard = injectDashboard(salesDashboard)
 * dashboard.params.period
 * ```
 */
export function injectDashboard<const TSchema extends DashboardSchemaLike>(
  schema: TSchema,
): DashboardApi<TSchema> {
  const instance = findDashboardInstance(schema)
  if (!instance)
    throw new Error(
      `[dashboard] injectDashboard() found no "${schema.key}" dashboard. Call useDashboard(schema) in a parent component.`,
    )
  // SAFETY: the context maps each schema object to the facade `useDashboard` built from it.
  return instance as DashboardApi<TSchema>
}

/**
 * Returns the handle of a view declared with `defineDashboardView`, from the dashboard an ancestor
 * created with `useDashboard(schema)`: its queries, derived values, params and filters (the shared
 * ones included), fully typed. A tab component needs nothing else.
 *
 * @example
 * ```ts
 * const consumption = useDashboardView(consumptionView)
 * consumption.params.year
 * ```
 */
export function useDashboardView<const TView extends DashboardViewLike>(
  view: TView,
): InferDashboardView<TView> {
  const handle = findDashboardInstance(view)
  if (!handle)
    throw new Error(
      '[dashboard] useDashboardView() found no dashboard with this view. Call useDashboard(schema) in a parent component, with the view in the schema `views`.',
    )
  // SAFETY: the context maps each declared view object to the handle built from it.
  return handle as InferDashboardView<TView>
}
