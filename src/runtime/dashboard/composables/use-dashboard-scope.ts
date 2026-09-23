import { computed, shallowRef } from 'vue'
import type { ComputedRef } from 'vue'

import type { DashboardResourceState, DashboardSourceLike, DashboardStage } from '../types'
import type {
  DashboardRuntimeQueryInput,
  DashboardRuntimeScopeInput,
  DashboardRuntimeStage,
} from '../types/runtime'
import { dashboardFilterBuilder } from '../utils/builders/dashboard-filters'
import type { DashboardEnvironment } from '../utils/environment'
import { createDashboardResourceFacade } from '../utils/resource'
import type { DashboardResourceSlot } from '../utils/resource'
import { assertDashboardMemberKey, resolveDashboardFilters } from '../utils/schema'
import {
  combineDashboardStates,
  refreshDashboardSources,
  resolveDashboardUpdatedAt,
} from '../utils/state'
import { createDashboardTrackedData } from '../utils/tracker'
import type { DashboardReadTracker } from '../utils/tracker'
import { useDashboardDerived } from './use-dashboard-derived'
import { useDashboardFilterScope } from './use-dashboard-filter-scope'
import { useDashboardResource } from './use-dashboard-resource'

interface DashboardDeclaration {
  stage: DashboardStage
  input: DashboardRuntimeQueryInput
  slot: DashboardResourceSlot
}

/**
 * One scope of a dashboard: the root, or one view. It owns the scope filters, declares its queries
 * in a single synchronous pass, instantiates them once their keys are known, and derives the scope
 * state from its essential queries.
 */
export function useDashboardScope(params: {
  schemaKey: string
  /** `''` for the root, the view key otherwise. */
  scopeKey: string
  input: DashboardRuntimeScopeInput
  prefix: string
  active: ComputedRef<boolean>
  /** The scope is part of the dashboard: always for the root, a view's `enabled` otherwise. */
  enabled?: ComputedRef<boolean>
  /** Dashboard auto-refresh interval in milliseconds, `0` when off. */
  refetchInterval: ComputedRef<number>
  /** Root queries and derived values, readable from a view's `derive`. */
  rootSources?: ReadonlyMap<string, DashboardSourceLike>
  tracker: DashboardReadTracker
  environment: DashboardEnvironment
}) {
  const { input, scopeKey } = params
  const enabled = params.enabled ?? computed<boolean>(() => true)
  const queryKey = [params.schemaKey, scopeKey || '$root']
  const scopeLabel = scopeKey ? `view "${scopeKey}"` : 'the dashboard root'
  const filterScope = useDashboardFilterScope({
    definitions: resolveDashboardFilters({ builder: dashboardFilterBuilder, input: input.filters }),
    environment: params.environment,
    owner: scopeLabel,
    prefix: params.prefix,
    queryKey,
  })

  const declared = shallowRef<boolean>(false)
  const declarations = new Map<DashboardSourceLike, DashboardDeclaration>()
  const resources: ReturnType<typeof useDashboardResource>[] = []
  const settled = computed<boolean>(
    () =>
      declared.value &&
      resources.every(
        (resource) => resource.stage !== 'essential' || resource.state.value !== 'loading',
      ),
  )

  function createStage(stage: DashboardStage): DashboardRuntimeStage {
    return {
      query(definition) {
        const query = typeof definition === 'function' ? { query: definition } : definition
        const slot: DashboardResourceSlot = shallowRef(null)
        const facade = createDashboardResourceFacade({
          defaultValue: query.defaultValue,
          slot,
          stage,
          tracker: params.tracker,
        })
        declarations.set(facade, { input: query, slot, stage })
        return facade
      },
    }
  }

  const exposed = input.queries?.({
    background: createStage('background'),
    deferred: createStage('deferred'),
    essential: createStage('essential'),
    filters: filterScope.values,
  })

  const taken = new Set<string>(params.rootSources?.keys())
  const members = new Map<string, DashboardSourceLike>()

  function instantiate(key: string, declaration: DashboardDeclaration) {
    const resource = useDashboardResource({
      environment: params.environment,
      id: scopeKey ? `${scopeKey}.${key}` : key,
      input: declaration.input,
      key,
      scope: {
        active: params.active,
        enabled,
        prefix: params.prefix,
        queryKey,
        refetchInterval: params.refetchInterval,
        settled,
      },
      stage: declaration.stage,
      tracker: params.tracker,
    })
    declaration.slot.value = resource
    resources.push(resource)
  }

  for (const [key, facade] of Object.entries(exposed ?? {})) {
    const declaration = declarations.get(facade)
    if (!declaration)
      throw new Error(`[dashboard] "${key}" in ${scopeLabel} is not a declared query.`)
    assertDashboardMemberKey(key, taken, scopeLabel)
    taken.add(key)
    declarations.delete(facade)
    instantiate(key, declaration)
    members.set(key, facade)
  }
  let anonymous = 0
  for (const declaration of declarations.values()) instantiate(`$${anonymous++}`, declaration)
  declared.value = true

  const data = createDashboardTrackedData(
    new Map([...(params.rootSources ?? []), ...members]),
    params.tracker,
  )
  const derived = input.derive?.({ data, filters: filterScope.values }) ?? {}
  for (const [key, evaluate] of Object.entries(derived)) {
    assertDashboardMemberKey(key, taken, scopeLabel)
    taken.add(key)
    const id = scopeKey ? `${scopeKey}.${key}` : key
    members.set(key, useDashboardDerived({ evaluate, id, tracker: params.tracker }))
  }

  const essentials = resources.filter((resource) => resource.stage === 'essential')
  const state = computed<DashboardResourceState>(() => {
    if (!enabled.value) return 'disabled'
    if (!params.active.value) return 'idle'
    const combined = combineDashboardStates(essentials.map((resource) => resource.state.value))
    // Nothing left to wait for: idle essentials were never requested, disabled ones never will be.
    return combined === 'idle' || combined === 'disabled' ? 'ready' : combined
  })

  const updatedAt = computed<number | undefined>(() =>
    resolveDashboardUpdatedAt(
      resources.flatMap((resource) => (resource.active.value ? [resource.updatedAt.value] : [])),
    ),
  )

  const refreshing = shallowRef<boolean>(false)
  let pending: Promise<void> | null = null

  function refresh(): Promise<void> {
    pending ??= refreshDashboardSources(
      resources.filter((resource) => resource.active.value && resource.state.value !== 'disabled'),
    ).finally(() => {
      pending = null
      refreshing.value = false
    })
    refreshing.value = true
    return pending
  }

  return {
    enabled,
    filterScope,
    label: input.label,
    members,
    refresh,
    refreshing,
    resources,
    state,
    updatedAt,
  }
}
