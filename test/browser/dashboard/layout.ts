import { mount } from '@vue/test-utils'
import { expect } from 'vitest'
import { defineComponent, h, nextTick, reactive } from 'vue'
import type { VNodeChild } from 'vue'

import DashboardWidget from '#ui-tools/dashboard/components/dashboard-widget.vue'
import type { DashboardResourceState } from '#ui-tools/dashboard/types'

import { setAppConfig, setBreakpoint } from '../../dom/nuxt-state'
import type { BreakpointKey } from '../../dom/nuxt-state'

/** A cell's box, relative to the content box of its grid. */
export interface CellBox {
  left: number
  top: number
  width: number
  height: number
}

/** A block source whose state the test drives: `disabled` hides the block bound to it. */
export interface TestSource {
  activate(): void
  data: number[]
  error: unknown
  fetching: boolean
  id: string
  refresh(): Promise<void>
  refreshing: boolean
  state: DashboardResourceState
  updatedAt: number | undefined
}

let sources = 0

export function testSource(state: DashboardResourceState = 'ready'): TestSource {
  sources += 1
  return reactive<TestSource>({
    activate() {},
    data: [1],
    error: null,
    fetching: false,
    id: `source-${sources}`,
    refresh: () => Promise.resolve(),
    refreshing: false,
    state,
    updatedAt: 0,
  })
}

/** A widget block of `size`, bound to `source`, with content of a given height. */
export function block(options: {
  size?: string
  source: TestSource
  height?: number
  content?: VNodeChild
}) {
  return h(
    DashboardWidget,
    { size: options.size, source: options.source, title: options.source.id },
    { default: () => options.content ?? h('div', { style: `height: ${options.height ?? 40}px` }) },
  )
}

/**
 * Mounts `render` into a host of a fixed width in the page, so layouts are measured against a known
 * width whatever the browser window.
 */
export async function mountLayout(
  render: () => VNodeChild,
  options: { width?: number; breakpoint?: BreakpointKey } = {},
) {
  setBreakpoint(options.breakpoint ?? 'xl')
  setAppConfig({})
  const host = document.createElement('div')
  host.dataset.layoutHost = ''
  host.style.width = `${options.width ?? 1000}px`
  document.body.append(host)
  const wrapper = mount(defineComponent({ render }), { attachTo: host })
  await settle()
  return {
    host,
    unmount() {
      wrapper.unmount()
      host.remove()
    },
    wrapper,
  }
}

/** Removes whatever a test left in the page, so the next one measures its own grids only. */
export function clearLayouts() {
  for (const host of document.querySelectorAll('[data-layout-host], [data-v-app]')) host.remove()
}

/** Lets Vue render and the browser lay out. */
export async function settle() {
  await nextTick()
  await new Promise((resolve) => requestAnimationFrame(resolve))
  await nextTick()
}

export function gridElement(name: string) {
  const element = document.querySelector<HTMLElement>(`[data-grid="${name}"]`)
  if (!element) throw new Error(`No grid "${name}"`)
  return element
}

/** Width of a grid's content box, unrounded (`clientWidth` rounds to whole pixels). */
export function innerWidth(name: string) {
  const grid = gridElement(name)
  return grid.getBoundingClientRect().width - 2 * grid.clientLeft
}

/**
 * Boxes of the laid-out cells of a grid. Hidden blocks render nothing and collapsed nested grids are
 * `display: none`, so neither has a box.
 */
export function cells(name: string): CellBox[] {
  const grid = gridElement(name)
  const origin = grid.getBoundingClientRect()
  const left = origin.left + grid.clientLeft
  const top = origin.top + grid.clientTop
  const laidOut = [...grid.children].filter((cell) => getComputedStyle(cell).display !== 'none')
  return laidOut.map((cell) => {
    const box = cell.getBoundingClientRect()
    return { height: box.height, left: box.left - left, top: box.top - top, width: box.width }
  })
}

/** Cells grouped into rows by their top edge. Flex lines stack in DOM order, so rows come out top first. */
export function rows(name: string): CellBox[][] {
  const lines = new Map<number, CellBox[]>()
  for (const cell of cells(name)) {
    const key = Math.round(cell.top)
    lines.set(key, [...(lines.get(key) ?? []), cell])
  }
  return [...lines.values()]
}

/** Width a CSS grid gives a run of `span` tracks out of `columns`, gaps included. */
export function spanWidth(options: {
  columns?: number
  gap?: number
  span: number
  width: number
}) {
  const columns = options.columns ?? 12
  const gap = options.gap ?? 16
  const track = (options.width - (columns - 1) * gap) / columns
  return track * options.span + (options.span - 1) * gap
}

/**
 * Widths of the cells of one row when `fill` is on: each starts at its span's width, and the width
 * left over is shared in proportion to the spans.
 */
export function filledWidths(options: {
  columns?: number
  gap?: number
  spans: number[]
  width: number
}) {
  const gap = options.gap ?? 16
  const bases = options.spans.map((span) => spanWidth({ ...options, gap, span }))
  const used = bases.reduce((total, basis) => total + basis, 0) + (bases.length - 1) * gap
  const free = options.width - used
  const shares = options.spans.reduce((total, span) => total + span, 0)
  return bases.map((basis, index) => basis + (free * (options.spans[index] ?? 0)) / shares)
}

/** Every width matches, to half a pixel (Chromium lays out in 1/64 px units). */
export function expectWidths(actual: readonly CellBox[], expected: readonly number[]) {
  expect(actual.map((cell) => cell.width)).toHaveLength(expected.length)
  for (const [index, cell] of actual.entries()) {
    expect(cell.width, `width of cell ${index}`).toBeCloseTo(expected[index] ?? Number.NaN, 0)
  }
}

/** Cells sit side by side, `gap` apart, from the left edge. */
export function expectPacked(actual: readonly CellBox[], gap = 16) {
  let left = 0
  for (const [index, cell] of actual.entries()) {
    expect(cell.left, `left edge of cell ${index}`).toBeCloseTo(left, 0)
    left += cell.width + gap
  }
}
