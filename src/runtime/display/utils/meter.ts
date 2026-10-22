import type { DisplayMeterProps, DisplayTone } from '../types'

/** Share of `max` filled by `value`, between 0 and 1. */
export function meterShare(value: number, max: number) {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return 0
  return Math.min(1, Math.max(0, value / max))
}

/** The tone of a filled share: `error` and `warning` from their thresholds, else the given tone. */
export function meterTone(
  share: number,
  tone: DisplayTone | undefined,
  thresholds: DisplayMeterProps['thresholds'],
): DisplayTone {
  const percent = share * 100
  if (thresholds?.error !== undefined && percent >= thresholds.error) return 'error'
  if (thresholds?.warning !== undefined && percent >= thresholds.warning) return 'warning'
  return tone ?? 'primary'
}

/** Percent widths of parts sharing a track, summing to at most 100. */
export function partWidths(values: readonly number[], max: number) {
  return values.map((value) => meterShare(value, max) * 100)
}
