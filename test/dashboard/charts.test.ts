import { describe, expect, it } from 'vitest'

import type { DashboardChartFrame } from '#ui-tools/dashboard'
import { resolveDashboardXyLayer } from '#ui-tools/dashboard/components/charts/unovis/xy-layers'
import {
  niceDashboardMax,
  niceDashboardTickCount,
  resolveDashboardAxis,
  resolveDashboardColor,
  resolveDashboardFormats,
  resolveDashboardSeries,
} from '#ui-tools/dashboard/utils/charts'
import { resolveDashboardClasses } from '#ui-tools/dashboard/utils/ui'

describe('dashboard axes', () => {
  it('rounds maxima up to readable bounds', () => {
    expect(niceDashboardMax(1_760)).toBe(2_000)
    expect(niceDashboardMax(118)).toBe(120)
    expect(niceDashboardMax(0)).toBe(1)
  })

  it('picks a tick count that lands every tick on a round number', () => {
    expect(niceDashboardTickCount(2_000)).toBe(4)
    expect(niceDashboardTickCount(1_500)).toBe(3)
    expect(niceDashboardTickCount(50)).toBe(5)
    expect(niceDashboardTickCount(7_000)).toBe(4)
  })

  it('resolves a domain with headroom and evenly spaced ticks', () => {
    expect(resolveDashboardAxis([1_180, 1_675, null, undefined], undefined)).toEqual({
      domain: [0, 2_000],
      ticks: [0, 500, 1_000, 1_500, 2_000],
    })
  })

  it('honours fixed bounds and tick counts, and never divides by zero', () => {
    expect(resolveDashboardAxis([30], { max: 100, ticks: 5 }).ticks).toEqual([
      0, 20, 40, 60, 80, 100,
    ])
    expect(resolveDashboardAxis([30], { max: 50, ticks: 0 }).ticks).toEqual([0, 50])
  })
})

describe('dashboard series', () => {
  it('maps palette slots and Nuxt UI colors to CSS variables', () => {
    expect(resolveDashboardColor(undefined, 7)).toBe('var(--nut-dash-s2)')
    expect(resolveDashboardColor('series-3', 0)).toBe('var(--nut-dash-s3)')
    expect(resolveDashboardColor('primary', 0)).toBe('var(--ui-primary)')
    expect(resolveDashboardColor('#ff9600', 0)).toBe('#ff9600')
  })

  it('keeps bars on the left axis', () => {
    const [bar, line] = resolveDashboardSeries<{ value: number }>(
      [
        { axis: 'right', key: 'billed', value: (row) => row.value },
        { axis: 'right', key: 'margin', type: 'line', value: (row) => row.value },
      ],
      'bar',
    )
    expect(bar).toMatchObject({ axis: 'left', type: 'bar' })
    expect(line).toMatchObject({ axis: 'right', type: 'line' })
  })
})

describe('dashboard formats', () => {
  it('formats numbers, changes, and shares for a locale, once per locale', () => {
    const formats = resolveDashboardFormats('en')
    expect(resolveDashboardFormats('en')).toBe(formats)
    expect(formats.number(1_234)).toBe('1,234')
    expect(formats.number(12_600)).toBe('12.6K')
    expect(formats.delta(12.4)).toBe('+12.4%')
    expect(formats.delta(-3)).toBe('-3%')
    expect(formats.percent(57)).toBe('57%')
  })
})

describe('dashboard classes', () => {
  it('merges defaults, app config, and the ui prop, later layers winning', () => {
    expect(
      resolveDashboardClasses(
        { title: 'text-sm font-semibold', value: 'text-2xl' },
        { title: 'text-base' },
        undefined,
        { title: 'font-light', value: 'text-3xl' },
      ),
    ).toEqual({ title: 'text-base font-light', value: 'text-3xl' })
  })
})

const format = (value: number) => `${value} u`

describe('dashboard xy layers', () => {
  const frame: DashboardChartFrame = {
    data: [
      { index: 0, values: [10, 8, 30] },
      { index: 1, values: [12, undefined, 31] },
    ],
    labels: ['Jan', 'Feb'],
    left: { domain: [0, 20], format, ticks: [0, 10, 20] },
    references: [
      { axis: 'left', label: '', position: 'end', value: 15 },
      { axis: 'right', label: 'Target', position: 'start', value: 40 },
    ],
    right: { domain: [0, 50], format, ticks: [0, 25, 50] },
    series: [
      {
        axis: 'left',
        color: 'var(--a)',
        dashed: false,
        index: 0,
        key: 'used',
        label: 'Used',
        type: 'area',
      },
      {
        axis: 'left',
        color: 'var(--b)',
        dashed: true,
        index: 1,
        key: 'prev',
        label: 'Prev',
        type: 'area',
      },
      {
        axis: 'right',
        color: 'var(--c)',
        dashed: false,
        index: 2,
        key: 'margin',
        label: 'Margin',
        type: 'line',
      },
    ],
    stacked: false,
    xDomain: [0, 1],
  }

  it('splits one axis into solid lines, dashed comparisons, fills, and markers', () => {
    const left = resolveDashboardXyLayer(frame, 'left')
    expect(left.bars.count).toBe(0)
    expect(left.solid.count).toBe(1)
    expect(left.dashed.count).toBe(1)
    expect(left.areas.map((area) => [area.key, area.opacity, area.data.length])).toEqual([
      ['used', 0.14, 2],
      ['prev', 0.06, 1],
    ])
    expect(left.dots.map((dots) => dots.key)).toEqual(['used'])
    expect(left.references).toEqual([
      { key: 'left-0', position: 'top-right', text: '15 u', value: 15 },
    ])
  })

  it('gives the secondary axis its own lines, references, and label color', () => {
    const right = resolveDashboardXyLayer(frame, 'right')
    expect(right.solid.count).toBe(1)
    expect(right.solid.y[0]?.({ index: 0, values: [1, 2, 3] })).toBe(3)
    expect(right.lineColor).toBe('var(--c)')
    expect(right.references[0]).toMatchObject({ position: 'top-left', text: 'Target' })
  })
})
