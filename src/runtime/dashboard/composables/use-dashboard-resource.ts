import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import type { QueryKey } from '@tanstack/vue-query'
import { computed, shallowRef } from 'vue'
import type { ComputedRef } from 'vue'

import type { QueryDefinition } from '../../shared/types/query'
import { hasProperty, isNullish } from '../../shared/utils/predicate'
import { DASHBOARD_QUERY_DEFAULTS } from '../constants/query'
import type { DashboardResourceState, DashboardSourceLike, DashboardStage } from '../types'
import type { DashboardRuntimeQueryInput } from '../types/runtime'
import { dashboardParamBuilder } from '../utils/builders/dashboard-params'
import { resolveDashboardParams } from '../utils/schema'
import {
  combineDashboardStates,
  joinDashboardUrlKey,
  refreshDashboardSources,
} from '../utils/state'
import type { DashboardReadTracker } from '../utils/tracker'
import { useDashboardParamScope } from './use-dashboard-param-scope'

/**
 * Owns one declared query: exactly one `useQuery`, its widget params, and the deferred activation
 * latch. Gating rewrites `enabled` on a stable definition, so hook order never changes, and a gated
 * resource never evaluates its factory (it does not subscribe to params it cannot use yet).
 *
 * `requires` runs through the read tracker: while it returns nothing, the resource follows the
 * resources it read (loading while they load), then settles on its default value once they are
 * ready without satisfying it.
 */
export function useDashboardResource(params: {
  id: string
  key: string
  stage: DashboardStage
  input: DashboardRuntimeQueryInput
  scope: {
    active: ComputedRef<boolean>
    settled: ComputedRef<boolean>
    prefix: string
    queryKey: QueryKey
    /** Dashboard auto-refresh interval in milliseconds, `0` when off. */
    refetchInterval: ComputedRef<number>
  }
  tracker: DashboardReadTracker
}) {
  const { input, stage, scope } = params
  const activated = shallowRef<boolean>(stage !== 'deferred')
  const widget = useDashboardParamScope({
    definitions: resolveDashboardParams({
      builder: dashboardParamBuilder,
      input: input.params,
      shared: {},
    }),
    prefix: joinDashboardUrlKey(scope.prefix, params.key),
    queryKey: [...scope.queryKey, params.id, 'params'],
  })

  const active = computed<boolean>(() => scope.active.value && activated.value)
  const gate = computed<boolean>(() => {
    if (!active.value) return false
    if (stage === 'background' && !scope.settled.value) return false
    return input.enabled?.() ?? true
  })
  const requirement = computed(() => {
    const sources = new Set<DashboardSourceLike>()
    if (!gate.value || !input.requires) return { sources: [], value: true }
    const value = params.tracker.run(sources, input.requires)
    return { sources: [...sources], value }
  })
  const enabled = computed<boolean>(() => gate.value && !isNullish(requirement.value.value))
  /** State of the resources `requires` read while it is not satisfied. */
  const upstream = computed<DashboardResourceState>(() =>
    combineDashboardStates(requirement.value.sources.map((source) => source.state)),
  )

  const query = useQuery<unknown, Error, unknown, QueryKey>(
    computed(() => (enabled.value ? resolveDefinition() : idleDefinition(params.id))),
  )

  function resolveDefinition(): DashboardResolvedQueryDefinition {
    const definition = input.query({ params: widget.values, required: requirement.value.value })
    const interval = scope.refetchInterval.value
    return {
      placeholderData: input.keepPreviousData === false ? undefined : keepPreviousData,
      // Polling pauses while the page is hidden (TanStack's `refetchIntervalInBackground: false`).
      refetchInterval: interval > 0 ? interval : false,
      refetchOnWindowFocus: DASHBOARD_QUERY_DEFAULTS.refetchOnWindowFocus,
      staleTime: input.staleTime ?? DASHBOARD_QUERY_DEFAULTS.staleTime[stage],
      ...definition,
      ...resolveSelect(definition),
      enabled: !(hasProperty(definition, 'enabled') && definition.enabled === false),
    }
  }

  /** The resource's `select` runs on top of the definition's own, if any. */
  function resolveSelect(definition: QueryDefinition) {
    const { select } = input
    if (!select) return {}
    const own: unknown = Reflect.get(definition, 'select')
    return { select: isSelector(own) ? (data: unknown) => select(own(data)) : select }
  }

  const state = computed<DashboardResourceState>(() => {
    if (!gate.value) return 'idle'
    if (!enabled.value) {
      if (upstream.value !== 'ready') return upstream.value
      return input.defaultValue === undefined ? 'idle' : 'ready'
    }
    if (query.isError.value) return 'error'
    return query.data.value === undefined ? 'loading' : 'ready'
  })
  const data = computed<unknown>(() =>
    enabled.value && query.data.value !== undefined ? query.data.value : input.defaultValue,
  )
  const error = computed<unknown>(() =>
    enabled.value
      ? (query.error.value ?? undefined)
      : requirement.value.sources.find((source) => source.state === 'error')?.error,
  )
  const refreshing = computed<boolean>(() => state.value === 'ready' && query.isFetching.value)
  // Placeholder data (the previous key's result) has no fetch time of its own: `0` until it lands.
  const updatedAt = computed<number | undefined>(() =>
    state.value === 'ready' && query.dataUpdatedAt.value > 0
      ? query.dataUpdatedAt.value
      : undefined,
  )

  function activate() {
    activated.value = true
  }

  async function refresh() {
    if (!activated.value) return activate()
    if (!enabled.value) return refreshDashboardSources(requirement.value.sources)
    await query.refetch({ throwOnError: true })
  }

  return {
    activate,
    active,
    data,
    error,
    id: params.id,
    refresh,
    refreshing,
    stage,
    state,
    updatedAt,
    widget,
  }
}

type DashboardResolvedQueryDefinition = QueryDefinition & {
  enabled: boolean
  placeholderData?: typeof keepPreviousData
  refetchInterval?: number | false
  refetchOnWindowFocus?: boolean
  staleTime?: number
}

function isSelector(value: unknown): value is (data: unknown) => unknown {
  return typeof value === 'function'
}

function idleDefinition(id: string): DashboardResolvedQueryDefinition {
  return {
    enabled: false,
    queryFn: () => Promise.resolve(null),
    queryKey: ['nuxt-ui-tools', 'dashboard', 'idle', id],
  }
}
