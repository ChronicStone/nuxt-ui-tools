import { isDate, isNumber, isString } from '../../shared/utils/predicate'
import type { DisplayDate } from '../types'

const DAY = 86_400_000

/** A valid `Date`, or `null` for missing and unparsable input. */
export function toDisplayDate(value: DisplayDate | undefined | null) {
  if (isDate(value)) return Number.isNaN(value.getTime()) ? null : value
  if (isString(value) || isNumber(value)) {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  }
  return null
}

/** Calendar days from `from` to `to`, ignoring the time of day. */
export function calendarDaysBetween(from: Date, to: Date) {
  const start = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())
  const end = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate())
  return Math.round((end - start) / DAY)
}

export function formatDisplayDate(date: Date, locale: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(locale, options).format(date)
}

/** "Tomorrow", "In 3 days", "2 days ago", capitalized like a sentence. */
export function formatRelativeDays(days: number, locale: string) {
  const text = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(days, 'day')
  return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1)
}

/** "3 days", "1 day". */
export function formatDayCount(days: number, locale: string) {
  return new Intl.NumberFormat(locale, { style: 'unit', unit: 'day', unitDisplay: 'long' }).format(
    days,
  )
}

/** Parts of a calendar leaf: "OCT.", "24", "thu.". */
export function calendarLeaf(date: Date, locale: string) {
  return {
    day: formatDisplayDate(date, locale, { day: 'numeric' }),
    month: formatDisplayDate(date, locale, { month: 'short' }).toLocaleUpperCase(locale),
    weekday: formatDisplayDate(date, locale, { weekday: 'short' }),
  }
}
