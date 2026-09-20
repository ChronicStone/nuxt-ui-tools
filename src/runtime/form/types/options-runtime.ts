import type { QueryKey, UseQueryOptions } from '@tanstack/vue-query'
import type { ComputedRef, Ref } from 'vue'

import type { ResolvedFormOption } from '../utils/options'
import type { FormValue } from './'

/**
 * Query options accepted by option sources once they cross the runtime boundary.
 */
export type FormRuntimeQueryOptions = Exclude<
  UseQueryOptions<FormValue, Error, FormValue, FormValue, QueryKey>,
  Ref<FormValue> | ComputedRef<FormValue>
>

/**
 * Option state registered by a mounted option field and read through the field API.
 */
export interface FormOptionRuntimeState {
  /** Options available to the control: loaded pages merged with hydrated selections. */
  items: ComputedRef<readonly ResolvedFormOption[]>
  /** Hydrated options for the current selection, including values outside the loaded pages. */
  selectedItems: ComputedRef<readonly ResolvedFormOption[]>
  pending: ComputedRef<boolean>
  fetching: ComputedRef<boolean>
  loading: ComputedRef<boolean>
  creating: ComputedRef<boolean>
  creatable: ComputedRef<boolean>
  createLabel: ComputedRef<string | undefined>
  error: ComputedRef<FormValue | null>
  disableOnLoading: ComputedRef<boolean>
  refreshable: ComputedRef<boolean>
  selectCreatedOption: ComputedRef<boolean>
  /** True when options load remotely with search and pagination. */
  remote: ComputedRef<boolean>
  /** Current remote search term. */
  search: ComputedRef<string>
  /** True when another remote page can be loaded. */
  hasMore: ComputedRef<boolean>
  /** True while a next page is loading. */
  loadingMore: ComputedRef<boolean>
  /** True when the last remote request failed and can be retried. */
  retryable: ComputedRef<boolean>
  /** Distance from the list end that triggers the next page. */
  prefetchDistance: ComputedRef<number | 'viewport'>
  refresh: () => Promise<void>
  retry: () => Promise<void>
  /** Starts remote loading, typically when the menu opens. */
  activate: () => void
  setSearch: (term: string) => void
  loadMore: () => Promise<void>
  /** Loads the direct children of a remote tree option. */
  loadChildren: (option: ResolvedFormOption) => Promise<void>
  add: (option: FormValue) => void
  create: (label: string) => Promise<ResolvedFormOption | null>
}
