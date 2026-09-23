import { computed, markRaw } from 'vue'

import type { DashboardDerived, DashboardResourceState, DashboardSourceLike } from '../types'
import {
  combineDashboardStates,
  refreshDashboardSources,
  resolveDashboardUpdatedAt,
} from '../utils/state'
import type { DashboardReadTracker } from '../utils/tracker'

/**
 * One `derive` entry. A single computed evaluates the value and records the sources it read; the
 * derived state is the combined state of those sources, so a card bound to a derived value gets the
 * same skeleton / error / refresh behaviour as a card bound to a query.
 */
export function useDashboardDerived(params: {
  id: string
  evaluate: () => unknown
  tracker: DashboardReadTracker
}): DashboardDerived<unknown> {
  const evaluation = computed(() => {
    const reads = new Set<DashboardSourceLike>()
    try {
      const value = params.tracker.run(reads, params.evaluate)
      return { error: undefined, sources: [...reads], value }
    } catch (error) {
      return { error, sources: [...reads], value: undefined }
    }
  })

  const sourcesState = computed<DashboardResourceState>(() =>
    combineDashboardStates(evaluation.value.sources.map((source) => source.state)),
  )
  const state = computed<DashboardResourceState>(() => {
    if (sourcesState.value !== 'ready') return sourcesState.value
    return evaluation.value.error === undefined ? 'ready' : 'error'
  })

  const derived: DashboardDerived<unknown> = markRaw({
    activate() {
      for (const source of evaluation.value.sources) source.activate()
    },
    get data() {
      params.tracker.record(derived)
      return evaluation.value.value
    },
    get error() {
      return (
        evaluation.value.error ??
        evaluation.value.sources.find((source) => source.state === 'error')?.error
      )
    },
    get fetching() {
      return evaluation.value.sources.some((source) => source.fetching ?? source.refreshing)
    },
    id: params.id,
    kind: 'derived',
    refresh: () => refreshDashboardSources(evaluation.value.sources),
    get refreshing() {
      return evaluation.value.sources.some((source) => source.refreshing)
    },
    get state() {
      return state.value
    },
    get updatedAt() {
      return resolveDashboardUpdatedAt(evaluation.value.sources.map((source) => source.updatedAt))
    },
  })
  return derived
}
