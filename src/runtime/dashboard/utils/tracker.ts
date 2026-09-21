import { markRaw } from 'vue'

import type { DashboardSourceLike } from '../types'

/**
 * Records which sources a derived value reads while it evaluates. One tracker is shared by the
 * whole dashboard; evaluation is synchronous, so a single "current collector" slot is enough.
 */
export function createDashboardReadTracker() {
  let current: Set<DashboardSourceLike> | null = null

  return {
    record(source: DashboardSourceLike) {
      current?.add(source)
    },
    run<TResult>(reads: Set<DashboardSourceLike>, evaluate: () => TResult): TResult {
      const previous = current
      current = reads
      try {
        return evaluate()
      } finally {
        current = previous
      }
    },
  }
}

export type DashboardReadTracker = ReturnType<typeof createDashboardReadTracker>

/** The `data` object handed to `derive`: each property reads a source's data and records the read. */
export function createDashboardTrackedData(
  sources: ReadonlyMap<string, DashboardSourceLike>,
  tracker: DashboardReadTracker,
): object {
  const data = {}
  for (const [key, source] of sources) {
    Object.defineProperty(data, key, {
      enumerable: true,
      get() {
        tracker.record(source)
        return source.data
      },
    })
  }
  return markRaw(data)
}
