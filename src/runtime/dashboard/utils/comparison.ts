import type { DashboardComparison, DashboardDateRange } from '../types'

/**
 * Range to compare `range` against: the period of the same length right before it (`previous`), or
 * the same dates a year earlier (`year`, Feb 29 falling back to Feb 28). `undefined` without a range
 * or with `none`. Days are calendar days: the result never drifts across daylight-saving changes.
 *
 * @example
 * ```ts
 * queryFn: () => api.revenue({
 *   range: params.range,
 *   previous: resolveDashboardComparisonRange(params.range, params.compare),
 * })
 * ```
 */
export function resolveDashboardComparisonRange(
  range: DashboardDateRange | null | undefined,
  comparison: DashboardComparison | null | undefined,
): DashboardDateRange | undefined {
  if (!range || !comparison || comparison === 'none') return undefined
  if (comparison === 'year') return { end: yearBefore(range.end), start: yearBefore(range.start) }
  const days = calendarDaysBetween(range.start, range.end) + 1
  const end = addDays(range.start, -1)
  return { end, start: addDays(end, -(days - 1)) }
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

function yearBefore(date: Date) {
  const shifted = new Date(date.getFullYear() - 1, date.getMonth(), date.getDate())
  // Feb 29 has no match a year earlier: the month overflowed, step back to its last day.
  return shifted.getMonth() === date.getMonth()
    ? shifted
    : new Date(shifted.getFullYear(), shifted.getMonth(), 0)
}

function calendarDaysBetween(start: Date, end: Date) {
  const from = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())
  const to = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate())
  return Math.max(0, Math.round((to - from) / 86_400_000))
}
