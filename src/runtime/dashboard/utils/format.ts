import type { DashboardFormatPreset, DashboardValueFormatter } from '../types'

/** Number formatters of one locale, one per preset except `points` (which needs messages). */
export type DashboardFormats = Record<
  Exclude<DashboardFormatPreset, 'points'>,
  DashboardValueFormatter
>

const formatsByLocale = new Map<string, DashboardFormats>()
const numberFormats = new Map<string, Intl.NumberFormat>()
const monthFormats = new Map<string, Intl.DateTimeFormat>()

/**
 * Intl uses a narrow no-break space (U+202F) to group digits in some locales (French). Several UI
 * fonts draw it with no width, so it becomes a regular no-break space: digits never touch, and a
 * value still never wraps.
 */
export function normalizeDashboardSpaces(text: string) {
  return text.replaceAll(' ', ' ')
}

/** One cached `Intl.NumberFormat` per locale and option set: building them is costly. */
export function resolveDashboardNumberFormat(
  locale: string,
  options: Intl.NumberFormatOptions,
): DashboardValueFormatter {
  const key = `${locale}|${JSON.stringify(options)}`
  let format = numberFormats.get(key)
  if (!format) {
    format = new Intl.NumberFormat(locale, options)
    numberFormats.set(key, format)
  }
  const resolved = format
  return (value) => normalizeDashboardSpaces(resolved.format(value))
}

/**
 * Preset formatters of one locale. They are created once per locale and shared by every block and
 * every `useDashboardFormat()` caller.
 */
export function resolveDashboardFormats(locale: string): DashboardFormats {
  const cached = formatsByLocale.get(locale)
  if (cached) return cached
  const plain = resolveDashboardNumberFormat(locale, { maximumFractionDigits: 1 })
  const compact = resolveDashboardNumberFormat(locale, {
    maximumFractionDigits: 1,
    notation: 'compact',
  })
  const percent = resolveDashboardNumberFormat(locale, {
    maximumFractionDigits: 1,
    style: 'percent',
  })
  const delta = resolveDashboardNumberFormat(locale, {
    maximumFractionDigits: 1,
    signDisplay: 'exceptZero',
    style: 'percent',
  })
  const formats: DashboardFormats = {
    compact,
    decimal: plain,
    delta: (value) => delta(value / 100),
    integer: resolveDashboardNumberFormat(locale, { maximumFractionDigits: 0 }),
    number: (value) => (Math.abs(value) >= 10_000 ? compact(value) : plain(value)),
    percent: (value) => percent(value / 100),
    ratio: percent,
    signed: resolveDashboardNumberFormat(locale, {
      maximumFractionDigits: 1,
      signDisplay: 'exceptZero',
    }),
  }
  formatsByLocale.set(locale, formats)
  return formats
}

/**
 * Name of a month, capitalized as a standalone label: `3` (1–12) or a date → "Mar" / "March".
 * Months use the stand-alone form of the locale ("mars" in French becomes "Mars").
 */
export function formatDashboardMonth(
  locale: string,
  value: number | Date,
  width: 'short' | 'long' = 'short',
) {
  const key = `${locale}|${width}`
  let format = monthFormats.get(key)
  if (!format) {
    format = new Intl.DateTimeFormat(locale, { month: width })
    monthFormats.set(key, format)
  }
  const date = typeof value === 'number' ? new Date(2000, value - 1, 1) : value
  const text = format.format(date)
  return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1)
}
