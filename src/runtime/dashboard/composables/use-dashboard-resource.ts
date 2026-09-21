import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import type { QueryKey } from '@tanstack/vue-query'
import { computed, shallowRef } from 'vue'
import type { ComputedRef } from 'vue'

import type { QueryDefinition } from '../../shared/types/query'
import { hasProperty, isNullish } from '../../shared/utils/predicate'
import { DASHBOARD_QUERY_DEFAULTS } from '../constants/query'
import type { DashboardResourceState, DashboardStage } from '../types'
import type { DashboardRuntimeQueryInput } from '../types/runtime'
import { dashboardParamBuilder } from '../utils/builders/dashboard-params'
import { joinDashboardUrlKey } from '../utils/state'
import { useDashboardParamScope } from './use-dashboard-param-scope'

/**
 * Owns one declared query: exactly one `useQuery`, its widget params, and the deferred activation
 * latch. Gating rewrites `enabled` on a stable definition, so hook order never changes, and a gated
 * resource never evaluates its factory (it does not subscribe to params it cannot use yet).
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
}) {
  const { input, stage, scope } = params
  const activated = shallowRef<boolean>(stage !== 'deferred')
  const widget = useDashboardParamScope({
    definitions: input.params?.(dashboardParamBuilder) ?? {},
    prefix: joinDashboardUrlKey(scope.prefix, params.key),
    queryKey: [...scope.queryKey, params.id, 'params'],
  })

  const active = computed<boolean>(() => scope.active.value && activated.value)
  const gate = computed<boolean>(() => {
    if (!active.value) return false
    if (stage === 'background' && !scope.settled.value) return false
    return input.enabled?.() ?? true
  })
  const required = computed<unknown>(() => (gate.value && input.requires ? input.requires() : true))
  const enabled = computed<boolean>(() => gate.value && !isNullish(required.value))

  const query = useQuery<unknown, Error, unknown, QueryKey>(
    computed(() => (enabled.value ? resolveDefinition() : idleDefinition(params.id))),
  )

  function resolveDefinition(): DashboardResolvedQueryDefinition {
    const definition = input.query({ params: widget.values, required: required.value })
    const interval = scope.refetchInterval.value
    return {
      placeholderData: input.keepPreviousData === false ? undefined : keepPreviousData,
      // Polling pauses while the page is hidden (TanStack's `refetchIntervalInBackground: false`).
      refetchInterval: interval > 0 ? interval : false,
      refetchOnWindowFocus: DASHBOARD_QUERY_DEFAULTS.refetchOnWindowFocus,
      staleTime: input.staleTime ?? DASHBOARD_QUERY_DEFAULTS.staleTime[stage],
      ...definition,
      enabled: !(hasProperty(definition, 'enabled') && definition.enabled === false),
    }
  }

  const state = computed<DashboardResourceState>(() => {
    if (!enabled.value) return 'idle'
    if (query.isError.value) return 'error'
    return query.data.value === undefined ? 'loading' : 'ready'
  })
  const data = computed<unknown>(() =>
    enabled.value && query.data.value !== undefined ? query.data.value : input.defaultValue,
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
    if (!enabled.value) return
    await query.refetch({ throwOnError: true })
  }

  return {
    activate,
    active,
    data,
    error: query.error,
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

function idleDefinition(id: string): DashboardResolvedQueryDefinition {
  return {
    enabled: false,
    queryFn: () => Promise.resolve(null),
    queryKey: ['nuxt-ui-tools', 'dashboard', 'idle', id],
  }
}
