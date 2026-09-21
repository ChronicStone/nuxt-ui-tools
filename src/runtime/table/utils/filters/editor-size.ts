import type { DataListControlSize } from '../../types'

const filterEditorSizeClasses = {
  lg: {
    editor: 'w-[min(22rem,calc(100vw-1rem))] min-w-52 max-w-[calc(100vw-1rem)]',
    empty: 'px-3 py-8 text-sm',
    footer: 'p-2',
    option: 'gap-3 px-3 py-2 text-sm',
    optionIcon: 'size-4',
    optionLabel: 'text-sm',
    scrollArea: 'p-2',
    searchHeader: 'p-1.5',
    skeletonCount: 'h-3.5 w-6',
    skeletonLine: 'h-3.5',
    wideEditor:
      'w-[min(42rem,calc(100vw-1rem))] min-w-[min(21rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)]',
  },
  md: {
    editor: 'w-[min(20rem,calc(100vw-1rem))] min-w-48 max-w-[calc(100vw-1rem)]',
    empty: 'px-2.5 py-6 text-[13px]',
    footer: 'p-1.5',
    option: 'gap-2.5 px-2.5 py-1.5 text-[13px]',
    optionIcon: 'size-3.5',
    optionLabel: 'text-[13px]',
    scrollArea: 'p-1.5',
    searchHeader: 'p-1',
    skeletonCount: 'h-3 w-5',
    skeletonLine: 'h-3',
    wideEditor:
      'w-[min(38rem,calc(100vw-1rem))] min-w-[min(20rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)]',
  },
  sm: {
    editor: 'w-[min(18rem,calc(100vw-1rem))] min-w-44 max-w-[calc(100vw-1rem)]',
    empty: 'px-2.5 py-5 text-xs',
    footer: 'p-1.5',
    option: 'gap-2 px-2 py-1 text-xs',
    optionIcon: 'size-3.5',
    optionLabel: 'text-xs',
    scrollArea: 'p-1',
    searchHeader: 'p-1',
    skeletonCount: 'h-3 w-5',
    skeletonLine: 'h-3',
    wideEditor:
      'w-[min(34rem,calc(100vw-1rem))] min-w-[min(19rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)]',
  },
  xl: {
    editor: 'w-[min(24rem,calc(100vw-1rem))] min-w-60 max-w-[calc(100vw-1rem)]',
    empty: 'px-4 py-10 text-base',
    footer: 'p-3',
    option: 'gap-3.5 px-4 py-3 text-base',
    optionIcon: 'size-5',
    optionLabel: 'text-base',
    scrollArea: 'p-3',
    searchHeader: 'p-2',
    skeletonCount: 'h-4 w-7',
    skeletonLine: 'h-4',
    wideEditor:
      'w-[min(46rem,calc(100vw-1rem))] min-w-[min(22rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)]',
  },
  xs: {
    editor: 'w-[min(16rem,calc(100vw-1rem))] min-w-44 max-w-[calc(100vw-1rem)]',
    empty: 'px-2 py-4 text-xs',
    footer: 'p-1',
    option: 'gap-1.5 px-1.5 py-1 text-xs',
    optionIcon: 'size-3.5',
    optionLabel: 'text-xs',
    scrollArea: 'p-1',
    searchHeader: 'p-1',
    skeletonCount: 'h-3 w-5',
    skeletonLine: 'h-3',
    wideEditor:
      'w-[min(30rem,calc(100vw-1rem))] min-w-[min(18rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)]',
  },
} satisfies Record<
  DataListControlSize,
  {
    editor: string
    wideEditor: string
    searchHeader: string
    scrollArea: string
    option: string
    optionIcon: string
    optionLabel: string
    skeletonLine: string
    skeletonCount: string
    footer: string
    empty: string
  }
>

export function resolveFilterEditorSizeClasses(size: DataListControlSize | undefined) {
  return filterEditorSizeClasses[size ?? 'md']
}
