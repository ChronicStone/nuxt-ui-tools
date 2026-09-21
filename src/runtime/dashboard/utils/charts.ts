import { isNullish } from '../../shared/utils/predicate'
import { resolveTextValue } from '../../shared/utils/render'
import type {
  DashboardAxisOptions,
  DashboardChartFrameAxis,
  DashboardLegendItem,
  DashboardSeries,
  DashboardSeriesColor,
  DashboardValueFormat,
} from '../types'

export const DASHBOARD_PALETTE_SIZE = 6

const nuxtUiColors = new Set([
  'error',
  'info',
  'neutral',
  'primary',
  'secondary',
  'success',
  'warning',
])

/**
 * Resolves a series color to a CSS value. Palette slots and Nuxt UI colors map to CSS variables, so
 * charts follow the theme and dark mode without re-rendering.
 */
export function resolveDashboardColor(
  color: DashboardSeriesColor | undefined,
  index: number,
): string {
  if (isNullish(color)) return `var(--nut-dash-s${(index % DASHBOARD_PALETTE_SIZE) + 1})`
  const slot = /^series-(\d)$/u.exec(color)
  if (slot) return `var(--nut-dash-s${slot[1]})`
  if (nuxtUiColors.has(color)) return `var(--ui-${color})`
  return color
}

/** A series with its display fields resolved once per render. */
export interface DashboardResolvedSeries<TRow> {
  key: string
  label: string
  color: string
  dashed: boolean
  type: 'bar' | 'line' | 'area'
  axis: 'left' | 'right'
  value: DashboardSeries<TRow>['value']
}

export function resolveDashboardSeries<TRow>(
  series: readonly DashboardSeries<TRow>[],
  defaultType: 'bar' | 'line' | 'area',
): DashboardResolvedSeries<TRow>[] {
  return series.map((entry, index) => {
    const type = entry.type ?? defaultType
    return {
      // Bars always use the left axis: the secondary axis only draws lines and areas.
      axis: type === 'bar' ? 'left' : (entry.axis ?? 'left'),
      color: resolveDashboardColor(entry.color, index),
      dashed: entry.dashed ?? false,
      key: entry.key,
      label: resolveTextValue(entry.label, entry.key),
      type,
      value: entry.value,
    }
  })
}

export function toDashboardLegend<TRow>(
  series: readonly DashboardResolvedSeries<TRow>[],
): DashboardLegendItem[] {
  return series.map(({ color, dashed, key, label }) => ({ color, dashed, key, label }))
}

/** Rounds a maximum up to a readable axis bound (1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8 × 10ⁿ). */
export function niceDashboardMax(value: number): number {
  if (value <= 0) return 1
  const power = 10 ** Math.floor(Math.log10(value))
  const step =
    [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((candidate) => value / power <= candidate) ?? 10
  return step * power
}

/** Interval count per nice mantissa: every tick lands on a round number. */
const niceTickCounts = new Map<number, number>([
  [1, 4],
  [1.2, 4],
  [1.5, 3],
  [2, 4],
  [2.5, 5],
  [3, 3],
  [4, 4],
  [5, 5],
  [6, 3],
  [8, 4],
  [10, 5],
])

/** Readable interval count for a nice maximum: `2000` → 4 (every 500), `1500` → 3, `50` → 5. */
export function niceDashboardTickCount(max: number): number {
  if (max <= 0) return 4
  const power = 10 ** Math.floor(Math.log10(max))
  return niceTickCounts.get(Number((max / power).toFixed(2))) ?? 4
}

/**
 * Value domain and tick values covering every value: `0` included, the top rounded to a readable
 * bound with some headroom, and evenly spaced ticks that land on round numbers.
 */
export function resolveDashboardAxis(
  values: readonly (number | null | undefined)[],
  axis: DashboardAxisOptions | undefined,
  headroom = 1.05,
): Pick<DashboardChartFrameAxis, 'domain' | 'ticks'> {
  const finite = values.filter((value): value is number => Number.isFinite(value))
  const min = axis?.min ?? Math.min(0, ...finite)
  const max = axis?.max ?? niceDashboardMax(Math.max(0, ...finite) * headroom)
  const count = Math.max(1, Math.round(axis?.ticks ?? niceDashboardTickCount(max - min)))
  const ticks = Array.from({ length: count + 1 }, (_, index) => min + ((max - min) * index) / count)
  return { domain: [min, max], ticks }
}

/** Default formatters of one locale: numbers, signed changes, and shares (both in percent). */
export interface DashboardFormats {
  /** Locale number, compact from 10 000 (`12,6 k`). */
  number: DashboardValueFormat
  /** Signed percent change: `12.4` → `+12,4 %`. */
  delta: DashboardValueFormat
  /** Percent share: `57` → `57 %`. */
  percent: DashboardValueFormat
}

const formatsByLocale = new Map<string, DashboardFormats>()

/**
 * Formatters of one locale. `Intl.NumberFormat` instances are costly to build and stateless, so they
 * are created once per locale and shared by every block.
 */
export function resolveDashboardFormats(locale: string): DashboardFormats {
  const cached = formatsByLocale.get(locale)
  if (cached) return cached
  const plain = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 })
  const compact = new Intl.NumberFormat(locale, { maximumFractionDigits: 1, notation: 'compact' })
  const delta = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
    signDisplay: 'exceptZero',
    style: 'percent',
  })
  const percent = new Intl.NumberFormat(locale, { maximumFractionDigits: 1, style: 'percent' })
  const formats: DashboardFormats = {
    delta: (value) => delta.format(value / 100),
    number: (value) => (Math.abs(value) >= 10_000 ? compact.format(value) : plain.format(value)),
    percent: (value) => percent.format(value / 100),
  }
  formatsByLocale.set(locale, formats)
  return formats
}

/** Escapes text interpolated into chart tooltip HTML. */
export function escapeDashboardHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

/** Deterministic pseudo-random sequence, so placeholders render identically on server and client. */
export function createDashboardSeededRandom(seed: string) {
  let state = [...seed].reduce(
    (hash, char) => Math.imul(hash ^ char.charCodeAt(0), 16_777_619),
    2_166_136_261,
  )
  return () => {
    state = Math.imul(state ^ (state >>> 15), state | 1)
    state ^= state + Math.imul(state ^ (state >>> 7), state | 61)
    return ((state ^ (state >>> 14)) >>> 0) / 4_294_967_296
  }
}
