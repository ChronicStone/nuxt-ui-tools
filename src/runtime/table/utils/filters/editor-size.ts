import type { DataListControlSize } from '../../types'

const filterEditorSizeClasses: Record<
  DataListControlSize,
  {
    editor: string
    searchHeader: string
    scrollArea: string
    option: string
    optionIcon: string
    optionLabel: string
    footer: string
    empty: string
  }
> = {
  xs: {
    editor: 'w-[min(13rem,calc(100vw-1rem))] min-w-44 max-w-52',
    searchHeader: 'p-1',
    scrollArea: 'p-1',
    option: 'gap-1.5 px-1.5 py-1 text-xs',
    optionIcon: 'size-3.5',
    optionLabel: 'text-xs',
    footer: 'p-1',
    empty: 'px-2 py-4 text-xs',
  },
  sm: {
    editor: 'w-[min(15rem,calc(100vw-1rem))] min-w-48 max-w-60',
    searchHeader: 'p-1.5',
    scrollArea: 'p-1',
    option: 'gap-2 px-2 py-1.5 text-xs',
    optionIcon: 'size-3.5',
    optionLabel: 'text-xs',
    footer: 'p-1.5',
    empty: 'px-2.5 py-5 text-xs',
  },
  md: {
    editor: 'w-[min(17rem,calc(100vw-1rem))] min-w-52 max-w-68',
    searchHeader: 'p-2',
    scrollArea: 'p-2',
    option: 'gap-3 px-3 py-2 text-sm',
    optionIcon: 'size-4',
    optionLabel: 'text-sm',
    footer: 'p-2',
    empty: 'px-3 py-8 text-sm',
  },
  lg: {
    editor: 'w-[min(19rem,calc(100vw-1rem))] min-w-56 max-w-76',
    searchHeader: 'p-2.5',
    scrollArea: 'p-2.5',
    option: 'gap-3 px-3.5 py-2.5 text-sm',
    optionIcon: 'size-4.5',
    optionLabel: 'text-sm',
    footer: 'p-2.5',
    empty: 'px-3.5 py-9 text-sm',
  },
}

export function resolveFilterEditorSizeClasses(size: DataListControlSize | undefined) {
  return filterEditorSizeClasses[size ?? 'md']
}
