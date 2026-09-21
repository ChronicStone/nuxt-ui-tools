import type { QueryDefinition } from '../../shared/types/query'
import type { LazyTextValue } from '../../shared/types/utils'
import type { DashboardParamBuilder, DashboardParamMap } from './params'
import type { DashboardSourceLike, DashboardStage } from './resource'

/**
 * Runtime (type-erased) view of the schema. The public schema types carry precise generics; the
 * runtime reads the same objects through these shapes after one normalization step.
 */
export interface DashboardRuntimeQueryInput {
  params?: (p: DashboardParamBuilder) => DashboardParamMap
  requires?: () => unknown
  enabled?: () => boolean
  query: (scope: { params: object; required: unknown }) => QueryDefinition
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
  params?: (p: DashboardParamBuilder) => DashboardParamMap
  queries?: (context: DashboardRuntimeQueriesContext) => Record<string, DashboardSourceLike>
  derive?: (context: DashboardRuntimeDeriveContext) => Record<string, () => unknown>
}

export interface DashboardRuntimeSchema extends DashboardRuntimeScopeInput {
  key: string
  urlPrefix?: string
  defaultView?: string
  views: [key: string, view: DashboardRuntimeScopeInput][]
}
