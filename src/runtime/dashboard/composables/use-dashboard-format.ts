import { computed, markRaw } from 'vue'

import { useUiToolsLocale } from '../../i18n/use-locale'
import { isNumber } from '../../shared/utils/predicate'
import type { DashboardFormatPreset, DashboardValueFormat, DashboardValueFormatter } from '../types'
import {
  formatDashboardMonth,
  resolveDashboardFormats,
  resolveDashboardNumberFormat,
} from '../utils/format'

/**
 * The number and month formatters dashboard blocks use, in the dashboard locale (the Nuxt UI locale
 * unless overridden). Use them for captions, labels, and any text next to a block so everything on
 * screen reads the same way. Reads are reactive: a locale switch re-renders what used them.
 *
 * @example
 * ```ts
 * const format = useDashboardFormat()
 * format.integer(12345) // "12,345"
 * format.percent(57) // "57%"
 * format.points(2.1) // "+2.1 pts"
 * format.currency(1200, 'EUR') // "€1,200"
 * format.month(3) // "Mar"
 * format.ratio(null) // "—"
 * ```
 *
 * Every number formatter takes `null` / `undefined` too, and prints "—" for them, so a missing rate
 * or an empty period needs no fallback in the template.
 */
export function useDashboardFormat() {
  const { code, t } = useUiToolsLocale()
  const formats = computed(() => resolveDashboardFormats(code.value))
  const plurals = computed(() => new Intl.PluralRules(code.value))

  /** Signed difference of two percentages: `2.1` → "+2.1 pts". */
  function points(value: number) {
    const form = plurals.value.select(Math.abs(value)) === 'one' ? 'pointsOne' : 'pointsOther'
    return t(`dashboard.format.${form}`, { value: formats.value.signed(value) })
  }

  /** Turns any block `format` (preset, `Intl` options, function) into a formatter. */
  function resolve(
    format: DashboardValueFormat | undefined,
    fallback: DashboardFormatPreset = 'number',
  ): DashboardValueFormatter {
    const current = format ?? fallback
    if (typeof current === 'function') return current
    if (typeof current === 'string') return current === 'points' ? points : formats.value[current]
    return resolveDashboardNumberFormat(code.value, current)
  }

  return markRaw({
    /** `12600` → "12.6K". */
    compact: orMissing((value) => formats.value.compact(value)),
    /** An amount in a currency, rounded to units unless `options` say otherwise. */
    currency: (
      value: number | null | undefined,
      currency: string,
      options?: Intl.NumberFormatOptions,
    ) =>
      isPresent(value)
        ? resolveDashboardNumberFormat(code.value, { currency, ...options })(value)
        : DASHBOARD_MISSING_VALUE,
    /** One decimal at most. */
    decimal: orMissing((value) => formats.value.decimal(value)),
    /** Signed percent change: `12.4` → "+12.4%". */
    delta: orMissing((value) => formats.value.delta(value)),
    /** Grouped, no decimals. */
    integer: orMissing((value) => formats.value.integer(value)),
    /** Month name, capitalized: `3` (1–12) or a date → "Mar" (`'long'`: "March"). */
    month: (value: number | Date, width: 'short' | 'long' = 'short') =>
      formatDashboardMonth(code.value, value, width),
    /** Grouped, one decimal at most, compact from 10,000. */
    number: orMissing((value) => formats.value.number(value)),
    /** A share out of 100: `57` → "57%". */
    percent: orMissing((value) => formats.value.percent(value)),
    points: orMissing(points),
    /** A share out of 1: `0.57` → "57%". */
    ratio: orMissing((value) => formats.value.ratio(value)),
    resolve,
    /** Signed number: `3` → "+3". */
    signed: orMissing((value) => formats.value.signed(value)),
  })
}

/** Text of a missing number: an empty period, a rate without a base. */
export const DASHBOARD_MISSING_VALUE = '—'

function isPresent(value: number | null | undefined): value is number {
  return isNumber(value) && Number.isFinite(value)
}

function orMissing(format: (value: number) => string) {
  return (value: number | null | undefined) =>
    isPresent(value) ? format(value) : DASHBOARD_MISSING_VALUE
}
