import { getCurrentInstance, inject, provide } from 'vue'
import type { InjectionKey } from 'vue'

import type {
  DashboardSchemaInput,
  DashboardSchemaLike,
  DashboardViewInput,
  InferDashboard,
  InferDashboardView,
} from '../types'

/** One dashboard created by `useDashboard`, as its descendants find it. */
export interface DashboardContextEntry {
  /** What `useDashboard` received: a schema, or a function returning one. */
  readonly source: unknown
  /** The schema the dashboard currently runs. */
  schema(): DashboardSchemaLike
  /** The dashboard object `useDashboard` returned. */
  readonly api: object
  /** Handle of a view, stable across rebuilds. */
  view(key: string): object | undefined
  /** Key of the view declared with this object, if the current schema has one. */
  findView(declaration: object): string | undefined
  /** Key of the view on screen. */
  current(): string | undefined
}

interface DashboardContext {
  /** Dashboards created by ancestors, the nearest last. */
  dashboards: readonly DashboardContextEntry[]
  /** The view whose slot renders the component, set by `UiDashboardPage`. */
  view?: { entry: DashboardContextEntry; key: string }
}

const dashboardContextKey: InjectionKey<DashboardContext> = Symbol('nuxt-ui-tools.dashboard')

function injectDashboardContext(): DashboardContext | null {
  return getCurrentInstance() ? inject(dashboardContextKey, null) : null
}

/** Makes a dashboard available to descendant components. */
export function provideDashboard(entry: DashboardContextEntry) {
  if (!getCurrentInstance()) return
  const parent = injectDashboardContext()
  provide(dashboardContextKey, { dashboards: [...(parent?.dashboards ?? []), entry] })
}

/**
 * Marks the components below as rendering one view of a dashboard, so `useDashboardView` resolves
 * a view function to it. `UiDashboardPage` does it around the current view's slot.
 */
export function provideDashboardView(dashboard: object, key: string) {
  const parent = injectDashboardContext()
  const entry = parent
    ? findLastEntry(parent.dashboards, (candidate) => candidate.api === dashboard)
    : undefined
  if (!parent || !entry) return
  provide(dashboardContextKey, { dashboards: parent.dashboards, view: { entry, key } })
}

/**
 * Returns the dashboard an ancestor component created with `useDashboard`, fully typed, so nested
 * components read it without props. Pass the schema, or the schema function: the nearest dashboard
 * built from it answers (for a function, the nearest dashboard).
 *
 * @example
 * ```ts
 * const account = injectDashboard(accountSchema)
 * account.filters.year
 * ```
 */
export function injectDashboard<const TInput extends DashboardSchemaInput>(
  input: TInput,
): InferDashboard<TInput> {
  const dashboards = injectDashboardContext()?.dashboards ?? []
  const entry =
    findLastEntry(
      dashboards,
      (candidate) => candidate.source === input || candidate.schema() === input,
    ) ?? (typeof input === 'function' ? dashboards.at(-1) : undefined)
  if (!entry)
    throw new Error(
      '[dashboard] injectDashboard() found no dashboard. Call useDashboard() in a parent component.',
    )
  // SAFETY: the entry holds the facade `useDashboard` built from this schema input.
  return entry.api as InferDashboard<TInput>
}

/**
 * Returns the handle of a view: its queries, derived values, filters and controls, fully typed. A
 * tab component needs nothing else.
 *
 * Pass the view, or the view function. Under `UiDashboardPage`, the view is the one whose slot
 * renders the component; elsewhere, a view object is found by identity and a view function reads
 * the view on screen.
 *
 * @example
 * ```ts
 * const consumption = useDashboardView(consumptionView)
 * consumption.filters.year
 * ```
 */
export function useDashboardView<const TInput extends DashboardViewInput>(
  input: TInput,
): InferDashboardView<TInput> {
  const context = injectDashboardContext()
  const handle = resolveView(context, input)
  if (!handle)
    throw new Error(
      '[dashboard] useDashboardView() found no view. Render the component in a view slot of UiDashboardPage, under a dashboard created with useDashboard() whose schema declares the view.',
    )
  // SAFETY: the handle is the one the dashboard built for this view declaration.
  return handle as InferDashboardView<TInput>
}

function resolveView(context: DashboardContext | null, input: DashboardViewInput) {
  if (!context) return undefined
  const enclosing = context.view
  // A view function has no identity to check: it is the view whose slot renders the component.
  if (
    enclosing &&
    (typeof input === 'function' || enclosing.entry.findView(input) === enclosing.key)
  )
    return enclosing.entry.view(enclosing.key)
  for (let index = context.dashboards.length - 1; index >= 0; index--) {
    const entry = context.dashboards[index]
    const key = typeof input === 'function' ? entry?.current() : entry?.findView(input)
    if (entry && key !== undefined) return entry.view(key)
  }
  return undefined
}

function findLastEntry(
  dashboards: readonly DashboardContextEntry[],
  match: (entry: DashboardContextEntry) => boolean,
) {
  for (let index = dashboards.length - 1; index >= 0; index--) {
    const entry = dashboards[index]
    if (entry && match(entry)) return entry
  }
  return undefined
}
