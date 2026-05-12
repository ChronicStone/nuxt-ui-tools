import type { ComputedRef } from 'vue'
import type { QueryKey } from '@tanstack/vue-query'
import type { ResolvedFormOption } from '../utils/options'

/**
 * Minimal query-options shape consumed by option-capable fields.
 *
 * The authored schema can return richer TanStack Query options; the field option runtime only
 * needs these properties to detect query-backed sources, run the query lazily while the field is
 * mounted, and expose the right loading state to the field component.
 */
export interface FormRuntimeQueryOptions {
  queryKey: QueryKey
  queryFn?: () => unknown
  enabled?: boolean
}

/**
 * Runtime state registered by option-capable fields.
 *
 * The form runtime keeps this state field-local and lazy: an option source only exists once
 * the field is mounted, which lets query-backed fields depend on mounted field context while
 * still exposing loader state through field APIs.
 */
export interface FormOptionRuntimeState {
  /** Current normalized options, including locally-created options. */
  items: ComputedRef<readonly ResolvedFormOption[]>
  /** True while the first usable option payload is loading. */
  pending: ComputedRef<boolean>
  /** True while options are refreshing after a usable payload already exists. */
  fetching: ComputedRef<boolean>
  /** True when controls should show a blocking loader. */
  loading: ComputedRef<boolean>
  /** Last option-source error, if any. */
  error: ComputedRef<unknown | null>
  /** True when the field should disable interactions while `loading` is true. */
  disableOnLoading: ComputedRef<boolean>
  /** Re-runs the field option source. */
  refresh: () => Promise<void>
  /** Appends a local option to the field option list without calling the async create handler. */
  add: (option: unknown) => void
  /** Creates and appends a local option when configured by the field. */
  create: (label: string) => Promise<ResolvedFormOption | null>
}
