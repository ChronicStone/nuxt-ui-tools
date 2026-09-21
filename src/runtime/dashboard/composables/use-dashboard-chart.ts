import { computed } from 'vue'

import { isDate } from '../../shared/utils/predicate'
import { resolveTextValue } from '../../shared/utils/render'
import type {
  DashboardAxisOptions,
  DashboardChartFrame,
  DashboardReferenceLine,
  DashboardSeries,
  DashboardValueFormat,
} from '../types'
import { resolveDashboardAxis, resolveDashboardSeries, toDashboardLegend } from '../utils/charts'
import { useDashboardFormat } from './use-dashboard-format'

/**
 * Resolves chart inputs into one plain frame: normalized datums (series values by index), x labels,
 * value domains with their ticks, and formatters. Rows and accessors are read once per data change;
 * the renderer only receives the frame.
 */
export function useDashboardChart<TRow>(params: {
  rows: () => readonly TRow[]
  x: () => (row: TRow, index: number) => string | number | Date
  xFormat: () => ((value: string | number | Date) => string) | undefined
  series: () => readonly DashboardSeries<TRow>[]
  defaultType: 'bar' | 'line' | 'area'
  yAxis: () => DashboardAxisOptions | undefined
  y2Axis?: () => DashboardAxisOptions | undefined
  references: () => DashboardReferenceLine | readonly DashboardReferenceLine[] | undefined
  stacked?: () => boolean
  format: () => DashboardValueFormat | undefined
}) {
  const formats = useDashboardFormat()
  const series = computed(() => resolveDashboardSeries(params.series(), params.defaultType))
  // Comparison (dashed) series draw first so they sit underneath, but read last in the legend.
  const legend = computed(() =>
    toDashboardLegend([
      ...series.value.filter((entry) => !entry.dashed),
      ...series.value.filter((entry) => entry.dashed),
    ]),
  )

  const frame = computed<DashboardChartFrame>(() => {
    const rows = params.rows()
    const accessor = params.x()
    const formatX = params.xFormat()
    const resolved = series.value
    const data = rows.map((row, index) => ({
      index,
      values: resolved.map((entry) => entry.value(row, index) ?? undefined),
    }))
    const labels = rows.map((row, index) => {
      const value = accessor(row, index)
      if (formatX) return formatX(value)
      return isDate(value) ? value.toLocaleDateString() : String(value)
    })

    const stacked = params.stacked?.() ?? false
    const hasBars = resolved.some((entry) => entry.type === 'bar')
    // Bars need headroom for their rounded tops; lines for their dots.
    const headroom = hasBars ? 1.05 : 1.08
    const references = [params.references() ?? []].flat().map((reference) => ({
      axis: reference.axis ?? 'left',
      label: resolveTextValue(reference.label, ''),
      position: reference.position ?? 'end',
      value: reference.value,
    }))
    const axisValues = (axis: 'left' | 'right') => {
      const indexes = resolved.flatMap((entry, index) => (entry.axis === axis ? [index] : []))
      const values =
        stacked && axis === 'left'
          ? data.map((datum) => indexes.reduce((sum, index) => sum + (datum.values[index] ?? 0), 0))
          : data.flatMap((datum) => indexes.map((index) => datum.values[index]))
      return [...values, ...references.filter((ref) => ref.axis === axis).map((ref) => ref.value)]
    }
    const format = params.format() ?? formats.number.value
    const yAxis = params.yAxis()
    const y2Axis = params.y2Axis?.()
    const hasRight = resolved.some((entry) => entry.axis === 'right')
    const last = Math.max(0, data.length - 1)

    return {
      data,
      labels,
      left: {
        ...resolveDashboardAxis(axisValues('left'), yAxis, headroom),
        format: yAxis?.format ?? format,
      },
      references,
      right: hasRight
        ? {
            ...resolveDashboardAxis(axisValues('right'), y2Axis, headroom),
            format: y2Axis?.format ?? format,
          }
        : null,
      series: resolved.map(({ axis, color, dashed, key, label, type }, index) => ({
        axis,
        color,
        dashed,
        index,
        key,
        label,
        type,
      })),
      stacked,
      // A single point still needs a non-empty domain, so it is centered like a bar slot.
      xDomain: hasBars || last === 0 ? [-0.5, last + 0.5] : [0, last],
    }
  })

  return { frame, legend }
}
