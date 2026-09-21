import { computed } from 'vue'

import { useUiToolsLocale } from '../../i18n/use-locale'
import type { LazyTextValue } from '../../shared/types/utils'
import { isDate } from '../../shared/utils/predicate'
import { resolveTextValue } from '../../shared/utils/render'
import type {
  DashboardAxisOptions,
  DashboardChartFrame,
  DashboardHighlight,
  DashboardReferenceLine,
  DashboardSelected,
  DashboardSelectEvent,
  DashboardSeries,
  DashboardValueFormat,
} from '../types'
import { tabulateDashboardFrame } from '../utils/chart-frame'
import {
  resolveDashboardAxis,
  resolveDashboardEmphasis,
  resolveDashboardSeries,
  toDashboardLegend,
} from '../utils/charts'
import { useDashboardFormat } from './use-dashboard-format'

/** A chart drawn taller in the expand dialog. */
export function resolveDashboardExpandedHeight(height: number) {
  return Math.max(420, Math.round(height * 1.6))
}

/**
 * Resolves chart inputs into one plain frame: normalized datums (series values by index), x labels,
 * value domains with their ticks, and formatters. Rows and accessors are read once per data change;
 * the renderer only receives the frame. Also provides the chart's table (menu actions) and maps
 * renderer selections back to rows.
 */
export function useDashboardChart<TRow>(params: {
  rows: () => readonly TRow[]
  x: () => (row: TRow, index: number) => string | number | Date
  xFormat: () => ((value: string | number | Date) => string) | undefined
  /** Header of the category column in the table view. */
  xLabel: () => LazyTextValue | undefined
  series: () => readonly DashboardSeries<TRow>[]
  defaultType: 'bar' | 'line' | 'area'
  yAxis: () => DashboardAxisOptions | undefined
  y2Axis?: () => DashboardAxisOptions | undefined
  references: () => DashboardReferenceLine | readonly DashboardReferenceLine[] | undefined
  stacked?: () => boolean
  format: () => DashboardValueFormat | undefined
  onSelect: () => ((event: DashboardSelectEvent<TRow>) => void) | undefined
  /** Bar charts: bars drawn at full strength, the others faded. */
  highlight?: () => DashboardHighlight<TRow> | undefined
  selected?: () => DashboardSelected<TRow> | undefined
  /** Bar charts: prints each group's value above its bars. */
  labels?: () => boolean
}) {
  const { t } = useUiToolsLocale()
  const formats = useDashboardFormat()
  const series = computed(() =>
    resolveDashboardSeries(params.series(), params.defaultType, (label) =>
      t('dashboard.compare.series', { label }),
    ),
  )
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
    const xLabels = rows.map((row, index) => {
      const value = accessor(row, index)
      if (formatX) return formatX(value)
      return isDate(value) ? value.toLocaleDateString() : String(value)
    })

    const stacked = params.stacked?.() ?? false
    const hasBars = resolved.some((entry) => entry.type === 'bar')
    const labels = hasBars && (params.labels?.() ?? false)
    // Bars need headroom for their rounded tops (and printed values); lines for their dots.
    const headroom = labels ? 1.16 : hasBars ? 1.05 : 1.08
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

    // Per-datum bar value: the stack total, or the tallest bar of the group.
    const barIndexes = resolved.flatMap((entry, index) => (entry.type === 'bar' ? [index] : []))
    const barValues = data.map((datum) => barIndexes.map((index) => datum.values[index] ?? 0))
    const barTotals = barValues.map((values) =>
      stacked ? values.reduce((sum, value) => sum + value, 0) : Math.max(0, ...values),
    )
    const selected = params.selected?.()
    const emphasis = hasBars
      ? resolveDashboardEmphasis(rows, barTotals, params.highlight?.(), selected)
      : null
    const leftFormat = yAxis?.format ?? format

    return {
      data,
      emphasis,
      labels: xLabels,
      left: {
        ...resolveDashboardAxis(axisValues('left'), yAxis, headroom),
        format: leftFormat,
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
      selection: selected
        ? rows.flatMap((row, index) => (selected(row, index) ? [index] : []))
        : [],
      stacked,
      valueLabels: labels
        ? barTotals.map((value, index) => ({
            index,
            strong: emphasis?.[index] ?? false,
            text: leftFormat(value),
            value,
          }))
        : [],
      // A single point still needs a non-empty domain, so it is centered like a bar slot.
      xDomain: hasBars || last === 0 ? [-0.5, last + 0.5] : [0, last],
    }
  })

  const tabulate = () =>
    tabulateDashboardFrame(
      frame.value,
      resolveTextValue(params.xLabel(), t('dashboard.table.category')),
    )
  const selectable = computed<boolean>(() => params.onSelect() !== undefined)
  function select(index: number) {
    const row = params.rows()[index]
    if (row !== undefined) params.onSelect()?.({ index, row })
  }

  return { frame, legend, select, selectable, tabulate }
}
