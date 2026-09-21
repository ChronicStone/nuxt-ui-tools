import type { DashboardChartDatum, DashboardChartFrame } from '../types'
import { escapeDashboardHtml } from './charts'

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
