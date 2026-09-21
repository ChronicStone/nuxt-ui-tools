import { onBeforeUnmount, onMounted, readonly, shallowRef } from 'vue'

import { useUiToolsLocale } from '../../i18n/use-locale'
import type { DashboardTimeValue } from '../types'
import {
  formatDashboardDateTime,
  formatDashboardDay,
  formatDashboardRelativeTime,
  toDashboardTime,
} from '../utils/time'

const TICK = 30_000

// One clock for every relative time on the page: a single interval, running while one is mounted.
const now = shallowRef<number>(Date.now())
let subscribers = 0
let timer: ReturnType<typeof setInterval> | undefined

function useDashboardNow() {
  // A new relative time renders against the current time, not the last tick (nor, on the server,
  // the time the module was imported).
  now.value = Date.now()
  onMounted(() => {
    subscribers += 1
    if (subscribers > 1) return
    now.value = Date.now()
    timer = setInterval(() => {
      now.value = Date.now()
    }, TICK)
  })
  onBeforeUnmount(() => {
    subscribers -= 1
    if (subscribers === 0) clearInterval(timer)
  })
  return readonly(now)
}

/**
 * Locale-aware time formatting that stays current: relative times re-render every 30 seconds
 * through one shared clock.
 */
export function useDashboardTime() {
  const { code } = useUiToolsLocale()
  const clock = useDashboardNow()
  return {
    /** Full date and time, for `title` attributes. */
    absolute: (value: DashboardTimeValue) =>
      formatDashboardDateTime(toDashboardTime(value), code.value),
    /** Day heading: `Today`, `Yesterday`, then the date. */
    day: (value: DashboardTimeValue) =>
      formatDashboardDay(toDashboardTime(value), clock.value, code.value),
    /** `3 min ago`, `yesterday`, then the date. */
    relative: (value: DashboardTimeValue) =>
      formatDashboardRelativeTime(toDashboardTime(value), clock.value, code.value),
  }
}
