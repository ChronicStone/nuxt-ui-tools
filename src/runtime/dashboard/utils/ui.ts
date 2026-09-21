import type { AppConfig } from 'nuxt/schema'
import { twMerge } from 'tailwind-merge'

import type { DashboardTableUi, DashboardUiConfig } from '../types'

/**
 * Resolves the classes of one block part: library defaults, then each override layer
 * (app config, then the `ui` prop), merged with tailwind-merge so later layers win.
 */
export function resolveDashboardClasses<TKey extends string>(
  defaults: Record<TKey, string>,
  ...layers: (Partial<Record<NoInfer<TKey>, string>> | undefined)[]
): Record<TKey, string> {
  const resolved = { ...defaults }
  for (const key in defaults) {
    resolved[key] = twMerge(defaults[key], ...layers.map((layer) => layer?.[key]))
  }
  return resolved
}

/** Default classes of `UiDashboardTable`, also used by the card's "view as table" action. */
export const DASHBOARD_TABLE_CLASSES = {
  bar: 'h-1.5 overflow-hidden rounded-full bg-[var(--nut-dash-track)]',
  head: 'sticky top-0 z-[1] bg-default',
  row: 'border-t border-[var(--nut-dash-grid)]',
  table: 'w-full border-collapse text-[13px]',
  td: 'px-2.5 py-2 text-muted first:ps-0 last:pe-0',
  th: 'px-2.5 pt-0.5 pb-2 text-xs font-medium whitespace-nowrap text-dimmed first:ps-0 last:pe-0',
  wrapper: 'min-w-0 overflow-auto',
} satisfies Record<keyof DashboardTableUi, string>

/**
 * A row with a `select` listener: highlighted on hover and keyboard focus of its button. The row box
 * never moves, so its divider stays aligned with the card content; the highlight is a pseudo-element
 * reaching 8px past both edges, behind the content (`isolate` keeps it inside the row).
 */
export const DASHBOARD_SELECTABLE_ROW =
  'relative isolate before:pointer-events-none before:absolute before:inset-y-0 before:-inset-x-2 before:-z-10 before:rounded-md before:transition-colors has-[>button:hover]:before:bg-elevated/60 has-[>button:focus-visible]:before:bg-elevated/60'

/**
 * A row shown as selected (`selected` prop): the same tint as the hover, stronger, and an accent
 * on its start edge, both drawn around the row box.
 */
export const DASHBOARD_SELECTED_ROW =
  'relative isolate before:pointer-events-none before:absolute before:inset-y-0 before:-inset-x-2 before:-z-10 before:rounded-md before:bg-elevated after:pointer-events-none after:absolute after:inset-y-2 after:-start-2 after:w-0.5 after:rounded-full after:bg-primary'

/**
 * Button stretched over a selectable row, and over its highlight. It is the row's only interactive
 * element, so the row keeps its list semantics and its content stays plain text; controls inside
 * the row sit above it.
 */
export const DASHBOARD_ROW_BUTTON =
  'absolute inset-y-0 -inset-x-2 cursor-pointer rounded-md outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset'

/** Button stretched over a table row. It stays inside the row: the table may scroll sideways. */
export const DASHBOARD_TABLE_ROW_BUTTON =
  'absolute inset-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset'

/** Reads `appConfig.nuxtUiTools.dashboard`; apps that do not declare it get no overrides. */
export function resolveAppDashboardUi(config: Pick<AppConfig, 'nuxtUiTools'>): DashboardUiConfig {
  return config.nuxtUiTools?.dashboard ?? {}
}
