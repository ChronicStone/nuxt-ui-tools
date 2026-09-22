import type { ComputedRef, Ref } from 'vue'

import type { QueryDefinition } from '../../shared/types/query'
import type { LazyTextValue } from '../../shared/types/utils'
import type { DashboardOptionsMenuBindings } from './filters'
import type { DashboardOption, DashboardParamBuilder, DashboardParamEntry } from './params'
import type { DashboardSourceLike, DashboardStage } from './resource'

/**
 * Runtime (type-erased) view of the schema. The public schema types carry precise generics; the
 * runtime reads the same objects through these shapes after one normalization step.
 */
export type DashboardRuntimeParamsInput =
  | Record<string, DashboardParamEntry>
  | ((p: DashboardParamBuilder, context: { params: object }) => Record<string, DashboardParamEntry>)

export interface DashboardRuntimeQueryInput {
  params?: DashboardRuntimeParamsInput
  requires?: () => unknown
  enabled?: () => boolean
  query: (scope: { params: object; required: unknown }) => QueryDefinition
  select?: (data: unknown) => unknown
  defaultValue?: unknown
  keepPreviousData?: boolean
  staleTime?: number
}

export interface DashboardRuntimeStage {
  query: (input: DashboardRuntimeQueryInput | (() => QueryDefinition)) => DashboardSourceLike
}

export type DashboardRuntimeStages = Record<DashboardStage, DashboardRuntimeStage>

export interface DashboardRuntimeQueriesContext extends DashboardRuntimeStages {
  params: object
}

export interface DashboardRuntimeDeriveContext {
  data: object
  params: object
}

export interface DashboardRuntimeScopeInput {
  label?: LazyTextValue
  /** Root params a standalone view reads. */
  shared?: Record<string, DashboardParamEntry>
  params?: DashboardRuntimeParamsInput
  queries?: (context: DashboardRuntimeQueriesContext) => Record<string, DashboardSourceLike>
  derive?: (context: DashboardRuntimeDeriveContext) => Record<string, () => unknown>
}

export interface DashboardRuntimeSchema extends DashboardRuntimeScopeInput {
  key: string
  urlPrefix?: string
  autoRefresh?: number
  defaultView?: string
  /** Views in declaration order. Each input is the object the schema declared (its identity). */
  views: [key: string, view: DashboardRuntimeScopeInput][]
}

/**
 * Option list behind one filter handle, static or remote. Both option composables return this
 * shape so the filter handle composes either without branching.
 */
export interface DashboardRuntimeOptionList {
  /** Options matching the current search. */
  items: ComputedRef<readonly DashboardOption[]>
  /** Every option known so far (all static items; loaded pages and hydrated values), by value key. */
  known: ComputedRef<ReadonlyMap<string, DashboardOption>>
  /** Position of each static option, used to keep multiple values in item order. */
  order: ComputedRef<ReadonlyMap<string, number> | null>
  loading: ComputedRef<boolean>
  loadingMore: ComputedRef<boolean>
  hasMore: ComputedRef<boolean>
  error: ComputedRef<unknown>
  /** Labels of selected values are being fetched. */
  resolving: ComputedRef<boolean>
  search: Ref<string>
  open: Ref<boolean>
  loadMore: () => void
  refresh: () => Promise<void>
  /** Menu bindings beyond items and keys (search wiring of remote lists). */
  menu: ComputedRef<Partial<DashboardOptionsMenuBindings>>
}
