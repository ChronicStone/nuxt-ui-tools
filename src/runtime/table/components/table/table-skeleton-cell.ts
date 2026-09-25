import { h } from 'vue'
import type { FunctionalComponent, VNode } from 'vue'

import { isNumber } from '../../../shared/utils/predicate'
import type {
  TableColumnAlign,
  TableColumnSkeleton,
  TableColumnSkeletonConfig,
  TableColumnSkeletonKind,
} from '../../types'

const SPREAD = [0.6, 0.15, 0.9, 0.4, 0.75, 0.05, 0.5, 0.3]
const TEXT_RANGE = [0.38, 0.78] as const
const NUMBER_RANGE = [0.28, 0.44] as const
const CAPTION_SHARE = 0.62
const GAPS: Partial<Record<TableColumnSkeletonKind, string>> = {
  badge: 'gap-1',
  dot: 'gap-2',
  icon: 'gap-1.5',
}

interface ShapeOptions {
  config: TableColumnSkeletonConfig
  seed: number
  align?: TableColumnAlign
}

function share(options: { width: TableColumnSkeletonConfig['width']; seed: number }) {
  if (isNumber(options.width)) return options.width
  const [min, max] = options.width ?? TEXT_RANGE
  return min + (max - min) * SPREAD[options.seed % SPREAD.length]!
}

function bar(options: { width: number; caption?: boolean }) {
  return h('span', {
    class: [
      'nut-dl-skeleton block max-w-full rounded-full',
      options.caption ? 'h-[0.55em]' : 'h-[0.66em]',
    ],
    style: { width: `${Math.round(options.width * 100)}%` },
  })
}

function lines(options: ShapeOptions & { lines: 1 | 2; range?: readonly [number, number] }) {
  const width = share({ seed: options.seed, width: options.config.width ?? options.range })
  return h(
    'span',
    {
      class: [
        'flex min-w-0 flex-1 flex-col gap-[0.5em]',
        options.align === 'right' ? 'items-end' : '',
        options.align === 'center' ? 'items-center' : '',
      ],
    },
    options.lines === 2
      ? [bar({ width }), bar({ caption: true, width: width * CAPTION_SHARE })]
      : [bar({ width })],
  )
}

const SHAPES: Record<
  Exclude<TableColumnSkeletonKind, 'none'>,
  (options: ShapeOptions) => VNode | VNode[]
> = {
  avatar: (options) => [
    h('span', {
      class: [
        'nut-dl-skeleton size-7 shrink-0',
        options.config.avatar === 'circle' ? 'rounded-full' : 'rounded-md',
      ],
    }),
    lines({ ...options, lines: options.config.lines ?? 2 }),
  ],
  badge: (options) =>
    Array.from({ length: options.config.count ?? 1 }, (_, index) =>
      h('span', {
        class: 'nut-dl-skeleton block h-[1.55em] shrink-0 rounded-md',
        style: {
          width: `${(3.6 + share({ seed: options.seed + index, width: [0, 1.6] })).toFixed(2)}em`,
        },
      }),
    ),
  check: () => h('span', { class: 'nut-dl-skeleton block size-4 shrink-0 rounded-[4px]' }),
  icon: (options) => [
    h('span', {
      class: [
        'nut-dl-skeleton size-[18px] shrink-0',
        options.config.avatar === 'circle' ? 'rounded-full' : 'rounded-[5px]',
      ],
    }),
    lines({ ...options, lines: options.config.lines ?? 1 }),
  ],
  dot: (options) => [
    h('span', { class: 'nut-dl-skeleton size-[7px] shrink-0 rounded-full' }),
    lines({ ...options, lines: options.config.lines ?? 1, range: [0.3, 0.6] }),
  ],
  number: (options) =>
    lines({ ...options, align: 'right', lines: options.config.lines ?? 1, range: NUMBER_RANGE }),
  progress: () => [
    h('span', { class: 'nut-dl-skeleton block h-1.5 min-w-0 flex-1 rounded-full' }),
    h('span', { class: 'nut-dl-skeleton block h-[0.66em] w-[2.4em] shrink-0 rounded-full' }),
  ],
  text: (options) => lines({ ...options, lines: options.config.lines ?? 1 }),
}

function resolve(skeleton: TableColumnSkeleton | undefined): TableColumnSkeletonConfig {
  if (!skeleton) return { kind: 'text' }
  return typeof skeleton === 'string' ? { kind: skeleton } : skeleton
}

interface TableSkeletonCellProps {
  skeleton?: TableColumnSkeleton
  align?: TableColumnAlign
  seed: number
}

const TableSkeletonCell: FunctionalComponent<TableSkeletonCellProps> = (props) => {
  const config = resolve(props.skeleton)
  if (config.kind === 'none') return null
  const align = config.kind === 'number' ? 'right' : props.align

  return h(
    'span',
    {
      class: [
        'nut-dl-skeleton-cell flex w-full min-w-0 items-center',
        GAPS[config.kind] ?? 'gap-2.5',
        align === 'right' ? 'justify-end' : '',
        align === 'center' ? 'justify-center' : '',
      ],
      'data-skeleton': config.kind,
    },
    SHAPES[config.kind]({ align, config, seed: props.seed }),
  )
}

TableSkeletonCell.props = ['skeleton', 'align', 'seed']
TableSkeletonCell.displayName = 'DataListTableSkeletonCell'

export default TableSkeletonCell
