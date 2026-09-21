import { describe, expect, it } from 'vitest'

import type { DashboardChartFrame, DashboardDataTable } from '#ui-tools/dashboard'
import { tabulateDashboardFrame } from '#ui-tools/dashboard/utils/chart-frame'
import { resolveDashboardComparisonRange } from '#ui-tools/dashboard/utils/comparison'
import {
  resolveDashboardFileName,
  toDashboardCell,
  toDashboardCsv,
} from '#ui-tools/dashboard/utils/export'
import {
  resolveDashboardSparkBars,
  resolveDashboardSparkline,
} from '#ui-tools/dashboard/utils/sparkline'
import { resolveDashboardUpdatedAt } from '#ui-tools/dashboard/utils/state'
import {
  formatDashboardDay,
  formatDashboardRelativeTime,
  toDashboardTime,
} from '#ui-tools/dashboard/utils/time'

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const NOW = new Date(2026, 8, 21, 12, 0).getTime()

const table: DashboardDataTable = {
  columns: [
    { key: 'label', label: 'Account "A"', numeric: false },
    { key: 'value', label: 'Value', numeric: true },
  ],
  rows: [
    [toDashboardCell('Acme, Inc.'), toDashboardCell(1234.5, '1 234,5')],
    [toDashboardCell('Globex'), toDashboardCell(null)],
  ],
}

describe('dashboard CSV export', () => {
  it('writes raw numbers and quotes text for comma-decimal locales', () => {
    expect(toDashboardCsv(table, 'fr')).toBe(
      '"Account ""A""";"Value"\r\n"Acme, Inc.";1234,5\r\n"Globex";',
    )
  })

  it('uses commas between fields for dot-decimal locales', () => {
    expect(toDashboardCsv(table, 'en')).toBe(
      '"Account ""A""","Value"\r\n"Acme, Inc.",1234.5\r\n"Globex",',
    )
  })

  it('derives a file name from the card title', () => {
    expect(resolveDashboardFileName('Consommation mensuelle (€)', 'csv')).toBe(
      'consommation-mensuelle.csv',
    )
    expect(resolveDashboardFileName('', 'csv')).toBe('dashboard.csv')
  })
})

describe('dashboard chart tables', () => {
  it('lists one row per x position with values in their axis format', () => {
    const frame: DashboardChartFrame = {
      data: [
        { index: 0, values: [10, 0.4] },
        { index: 1, values: [undefined, 0.5] },
      ],
      emphasis: null,
      labels: ['Jan', 'Feb'],
      left: { domain: [0, 20], format: (value) => `${value} u`, ticks: [0, 20] },
      references: [],
      right: { domain: [0, 1], format: (value) => `${value * 100}%`, ticks: [0, 1] },
      series: [
        {
          axis: 'left',
          color: 'red',
          dashed: false,
          index: 0,
          key: 'used',
          label: 'Used',
          type: 'bar',
        },
        {
          axis: 'right',
          color: 'blue',
          dashed: false,
          index: 1,
          key: 'rate',
          label: 'Rate',
          type: 'line',
        },
      ],
      selection: [],
      stacked: false,
      valueLabels: [],
      xDomain: [-0.5, 1.5],
    }
    const result = tabulateDashboardFrame(frame, 'Month')
    expect(result.columns.map((column) => [column.label, column.numeric])).toEqual([
      ['Month', false],
      ['Used', true],
      ['Rate', true],
    ])
    expect(result.rows).toEqual([
      [toDashboardCell('Jan'), toDashboardCell(10, '10 u'), toDashboardCell(0.4, '40%')],
      [toDashboardCell('Feb'), toDashboardCell(null), toDashboardCell(0.5, '50%')],
    ])
  })
})

describe('dashboard times', () => {
  it('formats short relative times, then dates from a week on', () => {
    const relative = (elapsed: number) => formatDashboardRelativeTime(NOW - elapsed, NOW, 'en')
    expect(relative(10_000)).toBe('now')
    expect(relative(5 * MINUTE)).toBe('5 min. ago')
    expect(relative(3 * HOUR)).toBe('3 hr. ago')
    expect(relative(26 * HOUR)).toBe('yesterday')
    expect(relative(3 * 24 * HOUR)).toBe('3 days ago')
    expect(relative(10 * 24 * HOUR)).toBe('Sep 11')
    expect(formatDashboardRelativeTime(new Date(2025, 0, 2).getTime(), NOW, 'en')).toBe(
      'Jan 2, 2025',
    )
    expect(formatDashboardRelativeTime(Number.NaN, NOW, 'en')).toBe('')
  })

  it('names days by calendar, not by elapsed hours', () => {
    const lateYesterday = new Date(2026, 8, 20, 23, 50).getTime()
    expect(formatDashboardDay(lateYesterday, NOW, 'en')).toBe('Yesterday')
    expect(formatDashboardDay(NOW - HOUR, NOW, 'fr')).toBe('Aujourd’hui')
    expect(formatDashboardDay(new Date(2026, 8, 14).getTime(), NOW, 'en')).toBe('Sep 14')
  })

  it('reads dates, epoch milliseconds, and ISO strings', () => {
    expect(toDashboardTime(new Date(NOW))).toBe(NOW)
    expect(toDashboardTime(NOW)).toBe(NOW)
    expect(toDashboardTime(new Date(NOW).toISOString())).toBe(NOW)
  })

  it('reports the oldest fetch time of a set of sources', () => {
    expect(resolveDashboardUpdatedAt([undefined, 30, 10, 20])).toBe(10)
    expect(resolveDashboardUpdatedAt([undefined])).toBeUndefined()
  })
})

describe('dashboard sparklines', () => {
  it('spans the data range and closes the area on the baseline', () => {
    expect(resolveDashboardSparkline([10, 20])).toEqual({
      area: 'M0.00,30.00L100.00,2.00L100.00,32L0.00,32Z',
      line: 'M0.00,30.00L100.00,2.00',
    })
  })

  it('leaves gaps at missing values and draws flat series mid-height', () => {
    const gapped = resolveDashboardSparkline([1, 2, null, 3, 4])
    expect(gapped?.line.match(/M/gu)).toHaveLength(2)
    expect(resolveDashboardSparkline([5, 5, 5])?.line).toBe('M0.00,16.00L50.00,16.00L100.00,16.00')
    expect(resolveDashboardSparkline([null, undefined])).toBeNull()
  })
})

describe('dashboard spark bars', () => {
  it('scales bars from zero, flags the last, and skips missing values', () => {
    const bars = resolveDashboardSparkBars([10, null, 20, 0])
    expect(bars?.map((bar) => [bar.x, bar.height, bar.last])).toEqual([
      [4.75, 15, false],
      [54.75, 30, false],
      [79.75, 1.5, true],
    ])
    expect(bars?.every((bar) => bar.y + bar.height === 32)).toBe(true)
    expect(resolveDashboardSparkBars([null])).toBeNull()
  })
})

function day(month: number, date: number, year = 2026) {
  return new Date(year, month - 1, date)
}

describe('dashboard comparison ranges', () => {
  it('takes the same number of days right before the range', () => {
    expect(
      resolveDashboardComparisonRange({ end: day(9, 30), start: day(9, 1) }, 'previous'),
    ).toEqual({ end: day(8, 31), start: day(8, 2) })
    // Across a daylight-saving change, days stay calendar days.
    expect(
      resolveDashboardComparisonRange({ end: day(11, 7), start: day(11, 1) }, 'previous'),
    ).toEqual({ end: day(10, 31), start: day(10, 25) })
  })

  it('takes the same dates a year earlier, Feb 29 falling back to Feb 28', () => {
    expect(
      resolveDashboardComparisonRange({ end: day(2, 29, 2028), start: day(2, 1, 2028) }, 'year'),
    ).toEqual({ end: day(2, 28, 2027), start: day(2, 1, 2027) })
  })

  it('returns nothing without a range or with `none`', () => {
    const range = { end: day(9, 30), start: day(9, 1) }
    expect(resolveDashboardComparisonRange(range, 'none')).toBeUndefined()
    expect(resolveDashboardComparisonRange(range, undefined)).toBeUndefined()
    expect(resolveDashboardComparisonRange(undefined, 'previous')).toBeUndefined()
  })
})
