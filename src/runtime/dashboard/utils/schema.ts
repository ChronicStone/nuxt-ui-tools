import type {
  DashboardParamBuilder,
  DashboardParamEntry,
  DashboardParamLike,
  DashboardReservedKey,
  DashboardSchemaLike,
} from '../types'
import type {
  DashboardRuntimeParamsInput,
  DashboardRuntimeSchema,
  DashboardRuntimeScopeInput,
} from '../types/runtime'

type DashboardRuntimeViews =
  | Record<string, DashboardRuntimeScopeInput>
  | ((
      view: (input: DashboardRuntimeScopeInput) => DashboardRuntimeScopeInput,
    ) => Record<string, DashboardRuntimeScopeInput>)

interface DashboardRuntimeSchemaInput extends DashboardRuntimeScopeInput {
  key: string
  urlPrefix?: string
  autoRefresh?: number
  defaultView?: string
  views?: DashboardRuntimeViews
}

const reservedKeys: ReadonlySet<string> = new Set<DashboardReservedKey>([
  'autoRefresh',
  'filtered',
  'filters',
  'options',
  'params',
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
 * creates. Views are resolved here (their builder is an identity function at runtime), keeping the
 * object each view was declared with: it is the view's identity for `useDashboardView`.
 */
export function resolveDashboardRuntimeSchema(schema: DashboardSchemaLike): DashboardRuntimeSchema {
  // SAFETY: `defineDashboardSchema` produces every schema. Its callbacks are typed against the
  // precise generic contexts the runtime builds from the same schema; only the generics are erased.
  const input = schema as DashboardRuntimeSchemaInput
  const declared =
    typeof input.views === 'function' ? input.views((view) => view) : (input.views ?? {})
  const views = Object.entries(declared)

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

/**
 * Resolves a params input into param definitions: the callback form runs with the `p` builder and
 * the shared params, and every filter factory in the map runs with the builder.
 */
export function resolveDashboardParams(params: {
  input: DashboardRuntimeParamsInput | undefined
  builder: DashboardParamBuilder
  shared: object
}): Record<string, DashboardParamLike> {
  const { builder, input } = params
  const map: Record<string, DashboardParamEntry> =
    typeof input === 'function' ? input(builder, { params: params.shared }) : (input ?? {})
  return Object.fromEntries(
    Object.entries(map).map(([key, entry]) => [
      key,
      typeof entry === 'function' ? entry(builder) : entry,
    ]),
  )
}

/** Dev guard mirroring the compile-time key checks, for schemas assembled without inference. */
export function assertDashboardMemberKey(key: string, taken: ReadonlySet<string>, scope: string) {
  if (reservedKeys.has(key) || taken.has(key)) {
    throw new Error(`[dashboard] "${key}" in ${scope} is reserved or already used.`)
  }
}
