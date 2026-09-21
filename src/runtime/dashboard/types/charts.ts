import type { DashboardValueFormat } from './blocks'

/** Normalized chart row: series values in series order. */
export interface DashboardChartDatum {
  index: number
  values: (number | undefined)[]
}

export interface DashboardChartFrameSeries {
  key: string
  label: string
  color: string
  dashed: boolean
  type: 'bar' | 'line' | 'area'
  axis: 'left' | 'right'
  /** Position in `DashboardChartDatum.values`. */
  index: number
}

export interface DashboardChartFrameAxis {
  domain: [number, number]
  /** Tick values, evenly spaced on round numbers. */
  ticks: number[]
  format: DashboardValueFormat
}

export interface DashboardChartFrameReference {
  value: number
  label: string
  axis: 'left' | 'right'
  position: 'start' | 'end'
}

/** Everything a chart renderer needs, precomputed from the block props and source data. */
export interface DashboardChartFrame {
  data: DashboardChartDatum[]
  labels: string[]
  series: DashboardChartFrameSeries[]
  /**
   * X domain in datum indexes. Charts with bars pad half a slot on both sides so every bar group
   * is centered on its label; line-only charts run edge to edge.
   */
  xDomain: [number, number]
  left: DashboardChartFrameAxis
  right: DashboardChartFrameAxis | null
  references: DashboardChartFrameReference[]
  stacked: boolean
}
