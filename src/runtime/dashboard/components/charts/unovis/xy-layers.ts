import type {
  DashboardChartDatum,
  DashboardChartFrame,
  DashboardChartFrameSeries,
} from '../../../types'

type DashboardXyAccessor = (datum: DashboardChartDatum) => number | undefined

/**
 * Series drawn by one unovis component: one accessor and one color per series. unovis calls the
 * color accessor with a datum (bars) or the whole data array (lines), then the series index.
 */
export interface DashboardXySeriesSet {
  count: number
  y: DashboardXyAccessor[]
  color: (datum: DashboardChartDatum | DashboardChartDatum[], index: number) => string
}

/** Marks of one series drawn from its defined points only (areas, point markers). */
export interface DashboardXyPointMark {
  key: string
  color: string
  data: DashboardChartDatum[]
  y: DashboardXyAccessor
}

/** Everything drawn against one value axis, resolved once per frame. */
export interface DashboardXyLayer {
  bars: DashboardXySeriesSet
  solid: DashboardXySeriesSet
  dashed: DashboardXySeriesSet
  /** Area fills; comparison (dashed) areas are fainter. */
  areas: (DashboardXyPointMark & { opacity: number })[]
  /** Point markers of solid line and area series. */
  dots: (DashboardXyPointMark & { stroke: () => string })[]
  references: {
    key: string
    value: number
    text: string
    position: 'top-left' | 'top-right'
  }[]
  /** Color of the axis' first line series (the right axis labels take it). */
  lineColor: string | null
}

function accessor(series: DashboardChartFrameSeries): DashboardXyAccessor {
  return (datum) => datum.values[series.index]
}

function seriesSet(series: readonly DashboardChartFrameSeries[]): DashboardXySeriesSet {
  return {
    color: (_datum, index) => series[index]?.color ?? 'var(--nut-dash-s1)',
    count: series.length,
    y: series.map(accessor),
  }
}

/** Only the points where the series has a value, so fills and markers do not drop to zero. */
function definedData(frame: DashboardChartFrame, series: DashboardChartFrameSeries) {
  return frame.data.filter((datum) => datum.values[series.index] !== undefined)
}

/** Splits the frame's series of one axis into the unovis components that draw them. */
export function resolveDashboardXyLayer(
  frame: DashboardChartFrame,
  axis: 'left' | 'right',
): DashboardXyLayer {
  const series = frame.series.filter((entry) => entry.axis === axis)
  const lines = series.filter((entry) => entry.type !== 'bar')
  const solid = lines.filter((entry) => !entry.dashed)
  const scale = axis === 'right' ? frame.right : frame.left

  return {
    areas: lines
      .filter((entry) => entry.type === 'area')
      .map((entry) => ({
        color: entry.color,
        data: definedData(frame, entry),
        key: entry.key,
        opacity: entry.dashed ? 0.06 : 0.14,
        y: accessor(entry),
      })),
    bars: seriesSet(series.filter((entry) => entry.type === 'bar')),
    dashed: seriesSet(lines.filter((entry) => entry.dashed)),
    dots: solid.map((entry) => ({
      color: entry.color,
      data: definedData(frame, entry),
      key: entry.key,
      stroke: () => entry.color,
      y: accessor(entry),
    })),
    lineColor: (solid[0] ?? lines[0])?.color ?? null,
    references: frame.references
      .filter((reference) => reference.axis === axis)
      .map((reference, index) => ({
        key: `${axis}-${index}`,
        position: reference.position === 'start' ? 'top-left' : 'top-right',
        text: reference.label || (scale ? scale.format(reference.value) : String(reference.value)),
        value: reference.value,
      })),
    solid: seriesSet(solid),
  }
}
