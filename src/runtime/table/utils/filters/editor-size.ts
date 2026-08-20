import type { DataListControlSize } from '../../types'

const filterEditorSizeClasses = {
  xs: {
    editor: 'w-[min(13rem,calc(100vw-1rem))] min-w-44 max-w-52',
    wideEditor:
      'w-[min(30rem,calc(100vw-1rem))] min-w-[min(18rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)]',
    searchHeader: 'p-1',
    scrollArea: 'p-1',
    option: 'gap-1.5 px-1.5 py-1 text-xs',
    optionIcon: 'size-3.5',
    optionLabel: 'text-xs',
    skeletonLine: 'h-3',
    skeletonCount: 'h-3 w-5',
    footer: 'p-1',
    empty: 'px-2 py-4 text-xs',
  },
  sm: {
    editor: 'w-[min(15rem,calc(100vw-1rem))] min-w-48 max-w-60',
    wideEditor:
      'w-[min(34rem,calc(100vw-1rem))] min-w-[min(19rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)]',
    searchHeader: 'p-1.5',
    scrollArea: 'p-1',
    option: 'gap-2 px-2 py-1.5 text-xs',
    optionIcon: 'size-3.5',
    optionLabel: 'text-xs',
    skeletonLine: 'h-3',
    skeletonCount: 'h-3 w-5',
    footer: 'p-1.5',
    empty: 'px-2.5 py-5 text-xs',
  },
  md: {
    editor: 'w-[min(17rem,calc(100vw-1rem))] min-w-52 max-w-68',
    wideEditor:
      'w-[min(38rem,calc(100vw-1rem))] min-w-[min(20rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)]',
    searchHeader: 'p-2',
    scrollArea: 'p-2',
    option: 'gap-3 px-3 py-2 text-sm',
    optionIcon: 'size-4',
    optionLabel: 'text-sm',
    skeletonLine: 'h-3.5',
    skeletonCount: 'h-3.5 w-6',
    footer: 'p-2',
    empty: 'px-3 py-8 text-sm',
  },
  lg: {
    editor: 'w-[min(19rem,calc(100vw-1rem))] min-w-56 max-w-76',
    wideEditor:
      'w-[min(42rem,calc(100vw-1rem))] min-w-[min(21rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)]',
    searchHeader: 'p-2.5',
    scrollArea: 'p-2.5',
    option: 'gap-3 px-3.5 py-2.5 text-sm',
    optionIcon: 'size-4.5',
    optionLabel: 'text-sm',
    skeletonLine: 'h-3.5',
    skeletonCount: 'h-3.5 w-6',
    footer: 'p-2.5',
    empty: 'px-3.5 py-9 text-sm',
  },
  xl: {
    editor: 'w-[min(21rem,calc(100vw-1rem))] min-w-60 max-w-84',
    wideEditor:
      'w-[min(46rem,calc(100vw-1rem))] min-w-[min(22rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)]',
    searchHeader: 'p-3',
    scrollArea: 'p-3',
    option: 'gap-3.5 px-4 py-3 text-base',
    optionIcon: 'size-5',
    optionLabel: 'text-base',
    skeletonLine: 'h-4',
    skeletonCount: 'h-4 w-7',
    footer: 'p-3',
    empty: 'px-4 py-10 text-base',
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
