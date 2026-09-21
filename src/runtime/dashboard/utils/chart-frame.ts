import type { DashboardChartDatum, DashboardChartFrame, DashboardDataTable } from '../types'
import { escapeDashboardHtml } from './charts'
import { toDashboardCell } from './export'

/** Table of a chart: one row per x position, one column per series, values in their axis format. */
export function tabulateDashboardFrame(
  frame: DashboardChartFrame,
  category: string,
): DashboardDataTable {
  return {
    columns: [
      { key: '$x', label: category, numeric: false },
      ...frame.series.map((series) => ({ key: series.key, label: series.label, numeric: true })),
    ],
    rows: frame.data.map((datum) => [
      toDashboardCell(frame.labels[datum.index]),
      ...frame.series.map((series) => {
        const value = datum.values[series.index]
        const axis = series.axis === 'right' && frame.right ? frame.right : frame.left
        return toDashboardCell(value, value === undefined ? '' : axis.format(value))
      }),
    ]),
  }
}

/** Tooltip HTML for one x position: the label, then one row per series with its formatted value. */
export function renderDashboardChartTooltip(
  frame: DashboardChartFrame,
  datum: DashboardChartDatum,
) {
  const rows = frame.series
    .map((series) => {
      const value = datum.values[series.index]
      if (value === undefined) return ''
      const axis = series.axis === 'right' && frame.right ? frame.right : frame.left
      return `<div class="nut-dash-tip-row"><i style="background:${series.color}"></i><span>${escapeDashboardHtml(series.label)}</span><b>${escapeDashboardHtml(axis.format(value))}</b></div>`
    })
    .join('')
  return `<div class="nut-dash-tip"><div class="nut-dash-tip-title">${escapeDashboardHtml(frame.labels[datum.index] ?? '')}</div>${rows}</div>`
}
