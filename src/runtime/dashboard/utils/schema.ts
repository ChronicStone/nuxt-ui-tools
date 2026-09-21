import type { DashboardReservedKey, DashboardSchemaLike } from '../types'
import type { DashboardRuntimeSchema, DashboardRuntimeScopeInput } from '../types/runtime'

interface DashboardRuntimeSchemaInput extends DashboardRuntimeScopeInput {
  key: string
  urlPrefix?: string
  autoRefresh?: number
  defaultView?: string
  views?: (
    view: (input: DashboardRuntimeScopeInput) => DashboardRuntimeScopeInput,
  ) => Record<string, DashboardRuntimeScopeInput>
}

const reservedKeys: ReadonlySet<string> = new Set<DashboardReservedKey>([
  'autoRefresh',
  'options',
  'params',
  'refresh',
  'refreshing',
  'schema',
  'state',
  'updatedAt',
  'view',
])

/**
 * Erases the schema generics once so the runtime can invoke every builder with the contexts it
 * creates. Views are resolved here (their builder is an identity function at runtime).
 */
export function resolveDashboardRuntimeSchema(schema: DashboardSchemaLike): DashboardRuntimeSchema {
  // SAFETY: `defineDashboardSchema` produces every schema. Its callbacks are typed against the
  // precise generic contexts the runtime builds from the same schema; only the generics are erased.
  const input = schema as DashboardRuntimeSchemaInput
  const views = Object.entries(input.views?.((view) => view) ?? {})

  return {
    autoRefresh: input.autoRefresh,
    defaultView: input.defaultView ?? views[0]?.[0],
    derive: input.derive,
    key: input.key,
    label: input.label,
    params: input.params,
    queries: input.queries,
    urlPrefix: input.urlPrefix,
    views,
  }
}

/** Dev guard mirroring the compile-time key checks, for schemas assembled without inference. */
export function assertDashboardMemberKey(key: string, taken: ReadonlySet<string>, scope: string) {
  if (reservedKeys.has(key) || taken.has(key)) {
    throw new Error(`[dashboard] "${key}" in ${scope} is reserved or already used.`)
  }
}
