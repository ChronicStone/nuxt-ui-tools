import { afterEach, describe, expect, it } from 'vitest'
import { h, ref } from 'vue'
import type { VNodeChild } from 'vue'

import {
  defineDashboardFilters,
  defineDashboardSchema,
  defineDashboardView,
} from '#ui-tools/dashboard'
import DashboardGrid from '#ui-tools/dashboard/components/dashboard-grid.vue'
import DashboardStat from '#ui-tools/dashboard/components/dashboard-stat.vue'
import type { DashboardResourceState } from '#ui-tools/dashboard/types'

import { mountDashboard } from '../../dom/dashboard/harness'
import { setBreakpoint } from '../../dom/nuxt-state'
import { must } from '../../helpers/must'
import {
  block,
  cells,
  clearLayouts,
  expectPacked,
  expectWidths,
  filledWidths,
  gridElement,
  innerWidth,
  mountLayout,
  rows,
  settle,
  spanWidth,
  testSource,
} from './layout'
import type { CellBox, TestSource } from './layout'

const WIDTH = 1000

let cleanup: (() => void) | undefined

afterEach(() => {
  cleanup?.()
  cleanup = undefined
  clearLayouts()
})

async function layout(render: () => VNodeChild, options?: Parameters<typeof mountLayout>[1]) {
  const mounted = await mountLayout(render, options)
  cleanup = mounted.unmount
  return mounted
}

interface GridProps {
  columns?: string
  fill?: boolean
  gap?: string
  size?: string
  variant?: 'cards' | 'panels'
}

function grid(name: string, props: GridProps, children: () => VNodeChild[]) {
  return h(DashboardGrid, { 'data-grid': name, ...props }, children)
}

/** Vertical space between the bottom of the `above` grid and the top of the `below` one. */
function spacing() {
  return (
    gridElement('below').getBoundingClientRect().top -
    gridElement('above').getBoundingClientRect().bottom
  )
}

function sources(count: number) {
  return Array.from({ length: count }, () => testSource())
}

function blocks(size: string, list: readonly TestSource[]) {
  return list.map((source) => block({ size, source }))
}

function total(line: readonly CellBox[], gap = 16) {
  return line.reduce((sum, cell) => sum + cell.width, 0) + (line.length - 1) * gap
}

async function setState(list: readonly TestSource[], state: DashboardResourceState) {
  for (const source of list) source.state = state
  await settle()
}

describe('dashboard grid layout', () => {
  it('gives each cell the width of its span, as the tracks of a CSS grid would', async () => {
    const [wide, narrow] = sources(2)
    const quarters = sources(4)
    await layout(() => [
      grid('thirds', {}, () => [
        block({ size: '8', source: must(wide) }),
        block({ size: '4', source: must(narrow) }),
      ]),
      grid('quarters', {}, () => blocks('3', quarters)),
    ])

    // Twelve tracks of (1000 - 11 × 16) / 12 px, 16px apart.
    expect(spanWidth({ span: 8, width: WIDTH })).toBeCloseTo(661.33, 1)
    expect(rows('thirds')).toHaveLength(1)
    expectWidths(cells('thirds'), [
      spanWidth({ span: 8, width: WIDTH }),
      spanWidth({ span: 4, width: WIDTH }),
    ])
    expectPacked(cells('thirds'))
    expect(rows('quarters')).toHaveLength(1)
    expectWidths(cells('quarters'), Array(4).fill(spanWidth({ span: 3, width: WIDTH })))
    expectPacked(cells('quarters'))
  })

  it('starts a new row where the next span would overflow the columns', async () => {
    const [first, second, third] = sources(3)
    await layout(() =>
      grid('rows', {}, () => [
        block({ size: '8', source: must(first) }),
        block({ size: '8', source: must(second) }),
        block({ size: '4', source: must(third) }),
      ]),
    )

    const lines = rows('rows')
    expect(lines.map((line) => line.length)).toEqual([1, 2])
    // A row holding a single 8 has width to spare: the block takes it.
    expectWidths(must(lines[0]), [WIDTH])
    expectWidths(must(lines[1]), [
      spanWidth({ span: 8, width: WIDTH }),
      spanWidth({ span: 4, width: WIDTH }),
    ])
  })

  it('shares the width a hidden block frees between the blocks left, by span', async () => {
    const [wide, first, second] = sources(3)
    await layout(() =>
      grid('row', {}, () => [
        block({ size: '6', source: must(wide) }),
        block({ size: '3', source: must(first) }),
        block({ size: '3', source: must(second) }),
      ]),
    )
    expectWidths(cells('row'), [
      spanWidth({ span: 6, width: WIDTH }),
      spanWidth({ span: 3, width: WIDTH }),
      spanWidth({ span: 3, width: WIDTH }),
    ])

    // The free tracks go to the blocks left in proportion to their spans: 6 + 3 becomes 8 + 4.
    await setState([must(second)], 'disabled')
    expectWidths(cells('row'), filledWidths({ spans: [6, 3], width: WIDTH }))
    expectWidths(cells('row'), [
      spanWidth({ span: 8, width: WIDTH }),
      spanWidth({ span: 4, width: WIDTH }),
    ])
    expect(total(cells('row'))).toBeCloseTo(WIDTH, 0)
    expectPacked(cells('row'))

    await setState([must(first)], 'disabled')
    expectWidths(cells('row'), [WIDTH])

    await setState([must(first), must(second)], 'ready')
    expectWidths(cells('row'), [
      spanWidth({ span: 6, width: WIDTH }),
      spanWidth({ span: 3, width: WIDTH }),
      spanWidth({ span: 3, width: WIDTH }),
    ])
    expectPacked(cells('row'))

    // Hiding the first block moves the others to the left edge.
    await setState([must(wide)], 'disabled')
    expectWidths(cells('row'), Array(2).fill((WIDTH - 16) / 2))
    expectPacked(cells('row'))
  })

  it('keeps the width of a block that loads, fails, or has nothing to show', async () => {
    const [wide, narrow] = sources(2)
    await layout(() =>
      grid('row', {}, () => [
        block({ size: '8', source: must(wide) }),
        block({ size: '4', source: must(narrow) }),
      ]),
    )
    const declared = [spanWidth({ span: 8, width: WIDTH }), spanWidth({ span: 4, width: WIDTH })]

    for (const state of ['loading', 'error', 'idle'] as const) {
      await setState([must(narrow)], state)
      expectWidths(cells('row'), declared)
    }
    must(narrow).state = 'ready'
    must(narrow).data = []
    await settle()
    expectWidths(cells('row'), declared)
  })

  it('keeps every cell at its span when fill is off', async () => {
    const [wide, narrow] = sources(2)
    const halves = sources(2)
    await layout(() => [
      grid('row', { fill: false }, () => [
        block({ size: '8', source: must(wide) }),
        block({ size: '4', source: must(narrow) }),
      ]),
      grid('short', { fill: false }, () => blocks('5', halves)),
    ])

    await setState([must(narrow)], 'disabled')
    expectWidths(cells('row'), [spanWidth({ span: 8, width: WIDTH })])
    expect(must(cells('row')[0]).left).toBeCloseTo(0, 0)
    expectWidths(cells('short'), Array(2).fill(spanWidth({ span: 5, width: WIDTH })))
    expectPacked(cells('short'))
  })

  it('stretches a short row by span, whatever made it short', async () => {
    const halves = sources(2)
    const stats = sources(5)
    await layout(() => [
      grid('short', {}, () => blocks('5', halves)),
      grid('phone', { columns: '2' }, () => blocks('1', stats)),
    ])

    expectWidths(cells('short'), Array(2).fill((WIDTH - 16) / 2))
    const lines = rows('phone')
    expect(lines.map((line) => line.length)).toEqual([2, 2, 1])
    expectWidths(must(lines[0]), Array(2).fill((WIDTH - 16) / 2))
    // The fifth block has a row to itself and takes all of it.
    expectWidths(must(lines[2]), [WIDTH])
  })

  it('closes a stat row up when one of its stats is hidden', async () => {
    const stats = sources(5)
    await layout(() =>
      grid('stats', { columns: '5', variant: 'panels' }, () =>
        stats.map((source, index) =>
          h(DashboardStat, { label: `Stat ${index}`, size: '1', source, value: () => index }),
        ),
      ),
    )
    const inner = innerWidth('stats')

    expect(rows('stats')).toHaveLength(1)
    expectWidths(cells('stats'), Array(5).fill((inner - 4) / 5))

    await setState([must(stats[3])], 'disabled')
    expect(rows('stats')).toHaveLength(1)
    expectWidths(cells('stats'), Array(4).fill((inner - 3) / 4))
    expectPacked(cells('stats'), 1)
  })

  it('follows responsive columns and spans at every breakpoint', async () => {
    const stats = sources(5)
    const panels = sources(3)
    await layout(
      () => [
        grid('stats', { columns: '2 md:3 xl:5' }, () => blocks('1', stats)),
        grid('panels', {}, () => blocks('12 md:6 xl:4', panels)),
      ],
      { breakpoint: 'xs' },
    )

    expect(rows('stats').map((line) => line.length)).toEqual([2, 2, 1])
    expectWidths(must(rows('stats')[2]), [WIDTH])
    expect(rows('panels').map((line) => line.length)).toEqual([1, 1, 1])
    expectWidths(cells('panels'), Array(3).fill(WIDTH))

    setBreakpoint('md')
    await settle()
    expect(rows('stats').map((line) => line.length)).toEqual([3, 2])
    expectWidths(
      must(rows('stats')[0]),
      Array(3).fill(spanWidth({ columns: 3, span: 1, width: WIDTH })),
    )
    expectWidths(must(rows('stats')[1]), Array(2).fill((WIDTH - 16) / 2))
    expect(rows('panels').map((line) => line.length)).toEqual([2, 1])
    expectWidths(must(rows('panels')[0]), Array(2).fill(spanWidth({ span: 6, width: WIDTH })))
    expectWidths(must(rows('panels')[1]), [WIDTH])

    setBreakpoint('xl')
    await settle()
    expect(rows('stats').map((line) => line.length)).toEqual([5])
    expectWidths(cells('stats'), Array(5).fill(spanWidth({ columns: 5, span: 1, width: WIDTH })))
    expect(rows('panels').map((line) => line.length)).toEqual([3])
    expectWidths(cells('panels'), Array(3).fill(spanWidth({ span: 4, width: WIDTH })))

    // A hidden block stays out of every layout the breakpoints give.
    await setState([must(stats[4])], 'disabled')
    expect(rows('stats').map((line) => line.length)).toEqual([4])
    expectWidths(cells('stats'), Array(4).fill((WIDTH - 3 * 16) / 4))
    setBreakpoint('md')
    await settle()
    expect(rows('stats').map((line) => line.length)).toEqual([3, 1])
    expectWidths(must(rows('stats')[1]), [WIDTH])
  })

  it('lays a phone screen out as full-width panels and two-column stats', async () => {
    const stats = sources(5)
    const [chart, donut] = sources(2)
    await layout(
      () => [
        grid('stats', { columns: '2 md:3 xl:5', variant: 'panels' }, () => blocks('1', stats)),
        grid('charts', { variant: 'panels' }, () => [
          block({ size: '12 md:6 xl:8', source: must(chart) }),
          block({ size: '12 md:6 xl:4', source: must(donut) }),
        ]),
      ],
      { breakpoint: 'xs', width: 390 },
    )
    const inner = innerWidth('stats')

    expect(rows('stats').map((line) => line.length)).toEqual([2, 2, 1])
    expectWidths(must(rows('stats')[0]), Array(2).fill((inner - 1) / 2))
    expectWidths(must(rows('stats')[2]), [inner])
    expect(rows('charts').map((line) => line.length)).toEqual([1, 1])
    expectWidths(cells('charts'), Array(2).fill(innerWidth('charts')))

    // A workspace that cannot see the fourth stat: two rows of two, no lone cell.
    await setState([must(stats[3])], 'disabled')
    expect(rows('stats').map((line) => line.length)).toEqual([2, 2])
    expectWidths(cells('stats'), Array(4).fill((inner - 1) / 2))
  })

  it('gives a block with no span, or a span wider than the grid, the whole row', async () => {
    const [unsized, oversized, invalid] = sources(3)
    await layout(() =>
      grid('row', { columns: '4' }, () => [
        block({ source: must(unsized) }),
        block({ size: '20', source: must(oversized) }),
        block({ size: '0', source: must(invalid) }),
      ]),
    )

    expect(rows('row').map((line) => line.length)).toEqual([1, 1, 1])
    expectWidths(cells('row'), [WIDTH, WIDTH, WIDTH])
  })

  it('never wraps a full row, whatever the width, gap, and column count', async () => {
    const layouts = [
      { columns: '12', spans: [4, 4, 4] },
      { columns: '12', spans: Array<number>(12).fill(1) },
      { columns: '12', spans: [5, 7] },
      { columns: '12', spans: [2, 3, 7] },
      { columns: '5', spans: [1, 1, 1, 1, 1] },
      { columns: '7', spans: Array<number>(7).fill(1) },
      { columns: '3', spans: [1, 2] },
      { columns: '24', spans: [6, 18] },
    ]
    const variants: { borders: number; gap: number; props: GridProps }[] = [
      { borders: 0, gap: 16, props: {} },
      { borders: 0, gap: 24, props: { gap: '24px' } },
      { borders: 2, gap: 1, props: { variant: 'panels' } },
    ]
    const failures: string[] = []

    for (const { columns, spans } of layouts) {
      for (const { borders, gap, props } of variants) {
        const list = sources(spans.length)
        const mounted = await mountLayout(() =>
          grid('row', { columns, ...props }, () =>
            list.map((source, index) => block({ size: String(spans[index]), source })),
          ),
        )
        try {
          // One grid, resized in steps of 1.37px so every fraction of a pixel comes up.
          for (let width = 320; width <= 1920; width += 1.37) {
            // A card is never narrower than its own padding: tracks that thin wrap by necessity.
            const narrowest = spanWidth({
              columns: Number(columns),
              gap,
              span: Math.min(...spans),
              width: width - borders,
            })
            if (narrowest < 64) continue
            mounted.host.style.width = `${width}px`
            const line = cells('row')
            const context = `${spans.join('+')} of ${columns}, gap ${gap}, at ${width.toFixed(2)}px`
            if (rows('row').length !== 1) failures.push(`${context}: wrapped`)
            else if (Math.abs(total(line, gap) - innerWidth('row')) > 0.5)
              failures.push(`${context}: ${total(line, gap)} of ${innerWidth('row')}`)
          }
        } finally {
          mounted.unmount()
        }
      }
    }

    expect(failures).toEqual([])
  })

  it('separates panels by a 1px rule inside the border, between cells and rows', async () => {
    const [wide, narrow, below] = sources(3)
    await layout(() =>
      grid('panels', { variant: 'panels' }, () => [
        block({ size: '8', source: must(wide) }),
        block({ size: '4', source: must(narrow) }),
        block({ size: '12', source: must(below) }),
      ]),
    )
    const element = gridElement('panels')

    expect(getComputedStyle(element).borderTopWidth).toBe('1px')
    expect(innerWidth('panels')).toBeCloseTo(WIDTH - 2, 1)
    const [top, bottom] = rows('panels')
    expectWidths(must(top), [
      spanWidth({ gap: 1, span: 8, width: WIDTH - 2 }),
      spanWidth({ gap: 1, span: 4, width: WIDTH - 2 }),
    ])
    expectPacked(must(top), 1)
    const [first] = must(top)
    expect(must(must(bottom)[0]).top - (must(first).top + must(first).height)).toBeCloseTo(1, 0)
  })

  it('spaces cells and rows by the gap it is given', async () => {
    const [wide, narrow, below] = sources(3)
    await layout(() =>
      grid('row', { gap: '24px' }, () => [
        block({ size: '8', source: must(wide) }),
        block({ size: '4', source: must(narrow) }),
        block({ size: '12', source: must(below) }),
      ]),
    )

    const [top, bottom] = rows('row')
    expectWidths(must(top), [
      spanWidth({ gap: 24, span: 8, width: WIDTH }),
      spanWidth({ gap: 24, span: 4, width: WIDTH }),
    ])
    expectPacked(must(top), 24)
    const [first] = must(top)
    expect(must(must(bottom)[0]).top - (must(first).top + must(first).height)).toBeCloseTo(24, 0)
  })

  it('makes the blocks of a row as tall as the tallest', async () => {
    const [short, tall] = sources(2)
    await layout(() =>
      grid('row', {}, () => [
        block({ height: 40, size: '6', source: must(short) }),
        block({ height: 240, size: '6', source: must(tall) }),
      ]),
    )

    const [left, right] = cells('row')
    expect(must(right).height).toBeGreaterThan(240)
    expect(must(left).height).toBeCloseTo(must(right).height, 0)
  })

  it('keeps wide content from widening its cell', async () => {
    const [wide, other] = sources(2)
    await layout(() =>
      grid('row', {}, () => [
        block({
          content: h('div', { style: 'width: 3000px; white-space: nowrap' }, 'wide content'),
          size: '6',
          source: must(wide),
        }),
        block({ size: '6', source: must(other) }),
      ]),
    )

    expectWidths(cells('row'), Array(2).fill(spanWidth({ span: 6, width: WIDTH })))
    expectPacked(cells('row'))
  })

  it('collapses a grid whose blocks are all hidden, and the gap it sat in', async () => {
    const [above, below] = sources(2)
    // Hidden from the first render: the grid never shows an empty frame.
    const hidden = [testSource('disabled'), testSource('disabled')]
    await layout(() =>
      h('div', { style: 'display: flex; flex-direction: column; gap: 16px' }, [
        grid('above', {}, () => [block({ source: must(above) })]),
        grid('middle', { variant: 'panels' }, () => blocks('6', hidden)),
        grid('below', {}, () => [block({ source: must(below) })]),
      ]),
    )
    expect(getComputedStyle(gridElement('middle')).display).toBe('none')
    expect(gridElement('middle').getBoundingClientRect().height).toBe(0)
    expect(spacing()).toBeCloseTo(16, 0)

    await setState([must(hidden[0])], 'ready')
    expect(getComputedStyle(gridElement('middle')).display).toBe('flex')
    const middle = gridElement('middle').getBoundingClientRect()
    expect(middle.top - gridElement('above').getBoundingClientRect().bottom).toBeCloseTo(16, 0)
    expect(gridElement('below').getBoundingClientRect().top - middle.bottom).toBeCloseTo(16, 0)
    expectWidths(cells('middle'), [WIDTH - 2])
  })

  it('treats a nested grid as a cell, and collapses it when its blocks are hidden', async () => {
    const [first, second, side] = sources(3)
    await layout(() =>
      grid('outer', {}, () => [
        grid('inner', { size: '8' }, () => [
          block({ size: '6', source: must(first) }),
          block({ size: '6', source: must(second) }),
        ]),
        block({ size: '4', source: must(side) }),
      ]),
    )
    const nested = spanWidth({ span: 8, width: WIDTH })

    expectWidths(cells('outer'), [nested, spanWidth({ span: 4, width: WIDTH })])
    expectWidths(cells('inner'), Array(2).fill(spanWidth({ span: 6, width: nested })))

    await setState([must(first)], 'disabled')
    expectWidths(cells('outer'), [nested, spanWidth({ span: 4, width: WIDTH })])
    expectWidths(cells('inner'), [nested])

    await setState([must(second)], 'disabled')
    expect(getComputedStyle(gridElement('inner')).display).toBe('none')
    expectWidths(cells('outer'), [WIDTH])

    await setState([must(first), must(second)], 'ready')
    expectWidths(cells('outer'), [nested, spanWidth({ span: 4, width: WIDTH })])
  })

  it('moves the next blocks up into the room a hidden block leaves', async () => {
    const [left, right] = sources(2)
    const thirds = sources(3)
    await layout(() =>
      grid('rows', {}, () => [
        block({ size: '6', source: must(left) }),
        block({ size: '6', source: must(right) }),
        ...blocks('4', thirds),
      ]),
    )
    expect(rows('rows').map((line) => line.length)).toEqual([2, 3])

    await setState([must(right)], 'disabled')
    const lines = rows('rows')
    expect(lines.map((line) => line.length)).toEqual([2, 2])
    expectWidths(must(lines[0]), filledWidths({ spans: [6, 4], width: WIDTH }))
    expectWidths(must(lines[1]), Array(2).fill((WIDTH - 16) / 2))
  })

  it('hides the blocks of a query whose condition fails, and lays the row out again', async () => {
    const workspace = ref<'ADMIN' | 'CLIENT'>('CLIENT')
    const context = defineDashboardFilters({
      workspace: (p) => p.enum(['ADMIN', 'CLIENT'], { defaultValue: 'ADMIN', sync: workspace }),
    })
    const consumption = defineDashboardView({
      label: 'Consumption',
      shared: context,
      queries: ({ essential, params }) => ({
        summary: essential.query(() => ({
          queryFn: () => Promise.resolve({ units: 12 }),
          queryKey: ['summary'],
        })),
        margin: essential.query({
          enabled: () => params.workspace === 'ADMIN',
          query: () => ({ queryFn: () => Promise.resolve({ rate: 0.4 }), queryKey: ['margin'] }),
        }),
      }),
    })
    const schema = defineDashboardSchema({ key: 'layout', params: context, views: { consumption } })
    const { flush, wrapper } = await mountDashboard({
      render: (dashboard) =>
        h('div', { style: `width: ${WIDTH}px` }, [
          grid('stats', { variant: 'panels' }, () => [
            h(DashboardStat, {
              label: 'Units',
              size: '8',
              source: dashboard.consumption.summary,
              value: () => 12,
            }),
            h(DashboardStat, {
              label: 'Margin',
              size: '4',
              source: dashboard.consumption.margin,
              value: () => 0.4,
            }),
          ]),
        ]),
      schema,
    })
    cleanup = () => wrapper.unmount()
    const inner = WIDTH - 2

    expectWidths(cells('stats'), [inner])

    workspace.value = 'ADMIN'
    await flush()
    await settle()
    expectWidths(cells('stats'), [
      spanWidth({ gap: 1, span: 8, width: inner }),
      spanWidth({ gap: 1, span: 4, width: inner }),
    ])
  })
})
