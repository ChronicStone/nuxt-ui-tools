import type { QueryKey, UseQueryOptions } from '@tanstack/vue-query'
import type { ComputedRef, Ref } from 'vue'

import type { ResolvedFormOption } from '../utils/options'

/** Complete TanStack Query options retained by form-owned observers. */
export type FormRuntimeQueryOptions = Exclude<
  UseQueryOptions<unknown, Error, unknown, unknown, QueryKey>,
  Ref<unknown> | ComputedRef<unknown>
>

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
  /** True while an option creation handler is pending. */
  creating: ComputedRef<boolean>
  /** True when the field has an option creation handler. */
  creatable: ComputedRef<boolean>
  /** Optional label for the explicit create affordance. */
  createLabel: ComputedRef<string | undefined>
  /** Last option-source error, if any. */
  error: ComputedRef<unknown | null>
  /** True when the field should disable interactions while `loading` is true. */
  disableOnLoading: ComputedRef<boolean>
  /** True when the field should render a refresh affordance. */
  refreshable: ComputedRef<boolean>
  /** True when created options should be selected immediately. */
  selectCreatedOption: ComputedRef<boolean>
  /** Re-runs the field option source. */
  refresh: () => Promise<void>
  /** Appends a local option to the field option list without calling the async create handler. */
  add: (option: unknown) => void
  /** Creates and appends a local option when configured by the field. */
  create: (label: string) => Promise<ResolvedFormOption | null>
}
