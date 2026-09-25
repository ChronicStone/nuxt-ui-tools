import type {
  DashboardFilterBuilder,
  DashboardFilterLike,
  DashboardReservedKey,
  DashboardSchemaLike,
} from '../types'
import type {
  DashboardRuntimeFiltersInput,
  DashboardRuntimeSchema,
  DashboardRuntimeScopeInput,
} from '../types/runtime'

interface DashboardRuntimeSchemaInput extends DashboardRuntimeScopeInput {
  key: string
  urlPrefix?: string
  autoRefresh?: number
  defaultView?: string
  views?: Record<string, DashboardRuntimeScopeInput>
  badges?: DashboardRuntimeSchema['badges']
}

const reservedKeys: ReadonlySet<string> = new Set<DashboardReservedKey>([
  'autoRefresh',
  'controls',
  'filtered',
  'filters',
  'refresh',
  'refreshing',
  'resetFilters',
  'schema',
  'state',
  'updatedAt',
  'view',
])

/**
 * Erases the schema generics once so the runtime can invoke every builder with the contexts it
 * creates. Views keep the object they were declared with.
 */
export function resolveDashboardRuntimeSchema(schema: DashboardSchemaLike): DashboardRuntimeSchema {
  // SAFETY: `defineDashboardSchema` produces every schema. Its callbacks are typed against the
  // precise generic contexts the runtime builds from the same schema; only the generics are erased.
  const input = schema as DashboardRuntimeSchemaInput
  const views = Object.entries(input.views ?? {})

  return {
    autoRefresh: input.autoRefresh,
    badges: input.badges,
    defaultView: input.defaultView ?? views[0]?.[0],
    derive: input.derive,
    filters: input.filters,
    key: input.key,
    label: input.label,
    queries: input.queries,
    urlPrefix: input.urlPrefix,
    views,
  }
}

/** Runs a scope's `filters` callback with the `f` builder. */
export function resolveDashboardFilters(params: {
  input: DashboardRuntimeFiltersInput | undefined
  builder: DashboardFilterBuilder
}): Record<string, DashboardFilterLike> {
  return params.input?.(params.builder) ?? {}
}

/** Dev guard mirroring the compile-time key checks, for schemas assembled without inference. */
export function assertDashboardMemberKey(key: string, taken: ReadonlySet<string>, scope: string) {
  if (reservedKeys.has(key) || taken.has(key)) {
    throw new Error(`[dashboard] "${key}" in ${scope} is reserved or already used.`)
  }
}
