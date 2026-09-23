import { markRaw } from 'vue'
import type { ShallowRef } from 'vue'

import type { useDashboardResource } from '../composables/use-dashboard-resource'
import type { DashboardResourceState, DashboardSourceLike, DashboardStage } from '../types'
import type { DashboardReadTracker } from './tracker'

export type DashboardResourceSlot = ShallowRef<ReturnType<typeof useDashboardResource> | null>

const emptyFacade = markRaw({})

type DashboardResourceFacade = DashboardSourceLike & {
  kind: 'query'
  stage: DashboardStage
  active: boolean
  filters: object
  controls: object
}

/**
 * Public resource object returned by `stage.query(...)`. It exists before its key is known (keys
 * come from the object the `queries` builder returns), so it reads the resource runtime through a
 * slot. Reads before instantiation track the slot, which keeps dependent gates reactive, and every
 * `data` read is recorded by the tracker, so `requires` and `derive` know what they depend on.
 */
export function createDashboardResourceFacade(params: {
  stage: DashboardStage
  slot: DashboardResourceSlot
  defaultValue: unknown
  tracker: DashboardReadTracker
}): DashboardResourceFacade {
  const { slot, stage, tracker } = params
  const facade: DashboardResourceFacade = markRaw({
    activate() {
      slot.value?.activate()
    },
    get active() {
      return slot.value?.active.value ?? false
    },
    get data() {
      tracker.record(facade)
      return slot.value ? slot.value.data.value : params.defaultValue
    },
    get error() {
      return slot.value?.error.value
    },
    get controls() {
      return slot.value?.filters.controls ?? emptyFacade
    },
    get filters() {
      return slot.value?.filters.values ?? emptyFacade
    },
    get id() {
      return slot.value?.id ?? ''
    },
    kind: 'query' as const,
    get fetching() {
      return slot.value?.fetching.value ?? false
    },
    refresh: () => slot.value?.refresh() ?? Promise.resolve(),
    get refreshing() {
      return slot.value?.refreshing.value ?? false
    },
    stage,
    get state(): DashboardResourceState {
      return slot.value?.state.value ?? 'idle'
    },
    get updatedAt() {
      return slot.value?.updatedAt.value
    },
  })
  return facade
}
