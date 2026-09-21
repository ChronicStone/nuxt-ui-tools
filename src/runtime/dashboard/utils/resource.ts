import { markRaw } from 'vue'
import type { ShallowRef } from 'vue'

import type { useDashboardResource } from '../composables/use-dashboard-resource'
import type { DashboardResourceState, DashboardSourceLike, DashboardStage } from '../types'

export type DashboardResourceSlot = ShallowRef<ReturnType<typeof useDashboardResource> | null>

const emptyFacade = markRaw({})

/**
 * Public resource object returned by `stage.query(...)`. It exists before its key is known (keys
 * come from the object the `queries` builder returns), so it reads the resource runtime through a
 * slot. Reads before instantiation track the slot, which keeps dependent gates reactive.
 */
export function createDashboardResourceFacade(
  stage: DashboardStage,
  slot: DashboardResourceSlot,
  defaultValue: unknown,
): DashboardSourceLike & {
  kind: 'query'
  stage: DashboardStage
  active: boolean
  params: object
  options: object
} {
  return markRaw({
    activate() {
      slot.value?.activate()
    },
    get active() {
      return slot.value?.active.value ?? false
    },
    get data() {
      return slot.value ? slot.value.data.value : defaultValue
    },
    get error() {
      return slot.value?.error.value ?? undefined
    },
    get id() {
      return slot.value?.id ?? ''
    },
    kind: 'query',
    get options() {
      return slot.value?.widget.options ?? emptyFacade
    },
    get params() {
      return slot.value?.widget.values ?? emptyFacade
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
}
