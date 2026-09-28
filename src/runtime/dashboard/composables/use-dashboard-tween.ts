import { TransitionPresets, usePreferredReducedMotion, useTransition } from '@vueuse/core'
import { computed } from 'vue'
import type { MaybeRefOrGetter } from 'vue'

import { isNumber } from '../../shared/utils/predicate'

/** How long a figure takes to count toward a new value. */
export const DASHBOARD_TWEEN_DURATION = 700

/**
 * Counts figures toward their new values instead of jumping to them: on the first load, a filter
 * change, or a refresh. Keep the list the same length between updates, since each position counts
 * from its previous value. Figures change at once when the user prefers reduced motion.
 */
export function useDashboardTween(figures: MaybeRefOrGetter<number[]>) {
  const reducedMotion = usePreferredReducedMotion()
  return useTransition(figures, {
    disabled: computed(() => reducedMotion.value === 'reduce'),
    duration: DASHBOARD_TWEEN_DURATION,
    transition: TransitionPresets.easeOutCubic,
  })
}

/**
 * The figure to show while counting toward `target`. Whole numbers count through whole numbers, so
 * a count never reads "12.3" on its way to 21; values that cannot be counted show as they are.
 */
export function countedFigure(target: number, current: number | undefined) {
  if (!Number.isFinite(target)) return target
  const shown = current !== undefined && Number.isFinite(current) ? current : target
  return Number.isInteger(target) ? Math.round(shown) : shown
}

/** A figure a tween can count toward: finite numbers, and zero for anything else. */
export function tweenTarget(value: unknown) {
  return isNumber(value) && Number.isFinite(value) ? value : 0
}
