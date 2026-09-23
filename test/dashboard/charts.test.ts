import { describe, expect, it } from 'vitest'

import type { DashboardChartFrame } from '#ui-tools/dashboard'
import { resolveDashboardXyLayer } from '#ui-tools/dashboard/components/charts/unovis/xy-layers'
import {
  fadeDashboardColor,
  niceDashboardMax,
  niceDashboardTickCount,
  resolveDashboardAxis,
  resolveDashboardColor,
  resolveDashboardEmphasis,
  resolveDashboardSeries,
} from '#ui-tools/dashboard/utils/charts'
import {
  formatDashboardMonth,
  resolveDashboardFormats,
  resolveDashboardNumberFormat,
} from '#ui-tools/dashboard/utils/format'
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

  it('keeps whole-number data on whole-number ticks, so integer labels never repeat', () => {
    // Nothing but zeros (an account with no activity yet), or nothing at all.
    expect(resolveDashboardAxis([0, 0, 0, null], undefined)).toEqual({
      domain: [0, 1],
      ticks: [0, 1],
    })
    expect(resolveDashboardAxis([null, undefined], undefined)).toEqual({
      domain: [0, 1],
      ticks: [0, 1],
    })
    // Small counts: whole steps, not quarters.
    expect(resolveDashboardAxis([1, 0], undefined)).toEqual({ domain: [0, 2], ticks: [0, 1, 2] })
    expect(resolveDashboardAxis([3, 1], undefined)).toEqual({
      domain: [0, 4],
      ticks: [0, 1, 2, 3, 4],
    })
    expect(resolveDashboardAxis([5], undefined)).toEqual({ domain: [0, 6], ticks: [0, 2, 4, 6] })
    expect(resolveDashboardAxis([-1, 1], undefined).ticks.every(Number.isInteger)).toBe(true)
    expect(resolveDashboardAxis([-1, 0], undefined).ticks.every(Number.isInteger)).toBe(true)
    // Fractional data keeps its fine steps.
    const fractional = resolveDashboardAxis([0.3], undefined)
    expect(fractional.domain).toEqual([0, 0.4])
    expect(fractional.ticks.map((tick) => Number(tick.toFixed(6)))).toEqual([0, 0.1, 0.2, 0.3, 0.4])
    // Explicit tick counts win.
    expect(resolveDashboardAxis([0], { ticks: 4 }).ticks).toEqual([0, 0.25, 0.5, 0.75, 1])
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
    // Nuxt UI defines no `--ui-neutral`.
    expect(resolveDashboardColor('neutral', 0)).toBe('var(--ui-text-muted)')
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
  it('reads a currency without a style as whole amounts in that currency', () => {
    expect(resolveDashboardNumberFormat('fr', { currency: 'EUR' })(12_345.6)).toBe('12\u00A0346\u00A0€')
    expect(resolveDashboardNumberFormat('en', { currency: 'USD' })(12_345.6)).toBe('$12,346')
    expect(
      resolveDashboardNumberFormat('en', { currency: 'EUR', notation: 'compact' })(250_000),
    ).toBe('€250K')
    // Own fraction digits, or an explicit style, are kept.
    expect(
      resolveDashboardNumberFormat('en', { currency: 'EUR', minimumFractionDigits: 2 })(3),
    ).toBe('€3.00')
    expect(resolveDashboardNumberFormat('en', { currency: 'EUR', style: 'decimal' })(3.25)).toBe(
      '3.25',
    )
  })

  it('formats numbers, changes, and shares for a locale, once per locale', () => {
    const formats = resolveDashboardFormats('en')
    expect(resolveDashboardFormats('en')).toBe(formats)
    expect(formats.number(1_234)).toBe('1,234')
    expect(formats.number(12_600)).toBe('12.6K')
    expect(formats.delta(12.4)).toBe('+12.4%')
    expect(formats.delta(-3)).toBe('-3%')
    expect(formats.percent(57)).toBe('57%')
    expect(formats.ratio(0.575)).toBe('57.5%')
    expect(formats.integer(12_345.6)).toBe('12,346')
    expect(formats.signed(3)).toBe('+3')
  })

  it('never lets grouped digits collapse, and capitalizes month labels', () => {
    expect(resolveDashboardFormats('fr').integer(12_345)).toBe('12\u00A0345')
    expect(formatDashboardMonth('fr', 3)).toBe('Mars')
    expect(formatDashboardMonth('en', new Date(2026, 0, 5), 'long')).toBe('January')
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
    emphasis: null,
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
    selection: [],
    stacked: false,
    valueLabels: [],
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

  it('fades the bars outside the emphasis', () => {
    const bars: DashboardChartFrame = {
      ...frame,
      emphasis: [false, true],
      series: [
        {
          axis: 'left',
          color: 'var(--a)',
          dashed: false,
          index: 0,
          key: 'used',
          label: 'Used',
          type: 'bar',
        },
      ],
    }
    const { color } = resolveDashboardXyLayer(bars, 'left').bars
    expect(color({ index: 1, values: [] }, 0)).toBe('var(--a)')
    expect(color({ index: 0, values: [] }, 0)).toBe(fadeDashboardColor('var(--a)'))
  })
})

describe('dashboard emphasis and comparison', () => {
  const rows = ['a', 'b', 'c']
  const totals = [4, 9, 9]

  it('picks the highlighted datums, the first of ties, and lets a selection win', () => {
    expect(resolveDashboardEmphasis(rows, totals, undefined, undefined)).toBeNull()
    expect(resolveDashboardEmphasis(rows, totals, 'max', undefined)).toEqual([false, true, false])
    expect(resolveDashboardEmphasis(rows, totals, 'min', undefined)).toEqual([true, false, false])
    expect(resolveDashboardEmphasis(rows, totals, 'last', undefined)).toEqual([false, false, true])
    expect(resolveDashboardEmphasis(rows, totals, (row) => row === 'a', undefined)).toEqual([
      true,
      false,
      false,
    ])
    // Nothing selected: the highlight still applies.
    expect(resolveDashboardEmphasis(rows, totals, 'max', () => false)).toEqual([false, true, false])
    expect(resolveDashboardEmphasis(rows, totals, 'max', (row) => row === 'c')).toEqual([
      false,
      false,
      true,
    ])
  })

  it('expands a series with `compare` into a faded comparison series', () => {
    const [bar, previousBar, line, previousLine] = resolveDashboardSeries<{ now: number }>(
      [
        { compare: () => 1, key: 'sales', label: 'Sales', value: (row) => row.now },
        {
          compare: () => 2,
          compareLabel: 'Last year',
          key: 'rate',
          type: 'area',
          value: (row) => row.now,
        },
      ],
      'bar',
      (label) => `${label} (before)`,
    )
    expect(bar).toMatchObject({ dashed: false, key: 'sales', type: 'bar' })
    expect(previousBar).toMatchObject({
      color: fadeDashboardColor('var(--nut-dash-s1)', 38),
      dashed: false,
      key: 'sales:compare',
      label: 'Sales (before)',
      type: 'bar',
    })
    expect(line?.type).toBe('area')
    expect(previousLine).toMatchObject({ dashed: true, label: 'Last year', type: 'line' })
    expect(previousLine?.value({ now: 5 }, 0)).toBe(2)
  })

  it('rounds diverging axes to a step that keeps zero on a tick', () => {
    expect(resolveDashboardAxis([-17, 23, 8], undefined)).toEqual({
      domain: [-20, 40],
      ticks: [-20, 0, 20, 40],
    })
    expect(resolveDashboardAxis([-4, 2], undefined)).toEqual({
      domain: [-6, 4],
      ticks: [-6, -4, -2, 0, 2, 4],
    })
  })
})
