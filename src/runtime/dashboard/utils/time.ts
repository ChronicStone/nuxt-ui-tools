import { isDate, isNumber } from '../../shared/utils/predicate'
import type { DashboardTimeValue } from '../types'

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** Epoch milliseconds of a time value; `NaN` when it cannot be parsed. */
export function toDashboardTime(value: DashboardTimeValue): number {
  if (isNumber(value)) return value
  if (isDate(value)) return value.getTime()
  return Date.parse(value)
}

interface DashboardTimeFormats {
  relative: Intl.RelativeTimeFormat
  date: Intl.DateTimeFormat
  dateWithYear: Intl.DateTimeFormat
  full: Intl.DateTimeFormat
}

const formatsByLocale = new Map<string, DashboardTimeFormats>()

function resolveTimeFormats(locale: string): DashboardTimeFormats {
  const cached = formatsByLocale.get(locale)
  if (cached) return cached
  const formats: DashboardTimeFormats = {
    date: new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }),
    dateWithYear: new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    full: new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeStyle: 'short' }),
    relative: new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' }),
  }
  formatsByLocale.set(locale, formats)
  return formats
}

/**
 * Short relative time: `now`, `3 min ago`, `2 hr ago`, `yesterday`, `4 days ago`, then the date
 * itself from a week on (with the year when it differs from `now`).
 */
export function formatDashboardRelativeTime(time: number, now: number, locale: string): string {
  if (!Number.isFinite(time)) return ''
  const formats = resolveTimeFormats(locale)
  const elapsed = now - time
  const distance = Math.abs(elapsed)
  const sign = elapsed >= 0 ? -1 : 1
  if (distance < 45_000) return formats.relative.format(0, 'second')
  if (distance < 45 * MINUTE)
    return formats.relative.format(sign * Math.round(distance / MINUTE), 'minute')
  if (distance < 22 * HOUR)
    return formats.relative.format(sign * Math.round(distance / HOUR), 'hour')
  if (distance < 7 * DAY) return formats.relative.format(sign * dayDistance(time, now), 'day')
  const sameYear = new Date(time).getFullYear() === new Date(now).getFullYear()
  return (sameYear ? formats.date : formats.dateWithYear).format(time)
}

/** Full date and time, for tooltips next to a relative time. */
export function formatDashboardDateTime(time: number, locale: string): string {
  return Number.isFinite(time) ? resolveTimeFormats(locale).full.format(time) : ''
}

/**
 * Day heading of a feed group: `Today`, `Yesterday`, then the date. Capitalized, since it starts a
 * line.
 */
export function formatDashboardDay(time: number, now: number, locale: string): string {
  if (!Number.isFinite(time)) return ''
  const formats = resolveTimeFormats(locale)
  const days = dayDistance(time, now)
  const sameYear = new Date(time).getFullYear() === new Date(now).getFullYear()
  const text =
    days < 2
      ? formats.relative.format(-days, 'day')
      : (sameYear ? formats.date : formats.dateWithYear).format(time)
  return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1)
}

/** Local start of the day of a time, used as a stable group key. */
export function startOfDashboardDay(time: number): number {
  const day = new Date(time)
  day.setHours(0, 0, 0, 0)
  return day.getTime()
}

/** Calendar days between two times, in local time (`yesterday` at 23:59 is one day ago). */
function dayDistance(time: number, now: number) {
  return Math.round(Math.abs(startOfDashboardDay(now) - startOfDashboardDay(time)) / DAY)
}
