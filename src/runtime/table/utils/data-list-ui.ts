import { twMerge } from 'tailwind-merge'

import type {
  DataListControlSize,
  DataListContentSurface,
  DataListDensity,
  DataListPartConfig,
  DataListPopoverSizing,
  DataListSearchConfig,
  DataListUiClass,
  DataListUiConfig,
} from '../types'

const dataListPopoverContentClass =
  'overflow-hidden [&>div]:w-full [&>div]:min-w-0 [&>div]:max-w-full [&>div>div]:w-full [&>div>div]:min-w-0 [&>div>div]:max-w-full [&_[data-filter-stage-content]>div]:!w-full [&_[data-filter-stage-content]>div]:!min-w-0 [&_[data-filter-stage-content]>div]:!max-w-full'

const dataListPopoverSizingClasses = {
  fit: 'w-fit min-w-[min(12rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)]',
  trigger:
    'w-[var(--reka-popover-trigger-width)] min-w-[var(--reka-popover-trigger-width)] max-w-[var(--reka-popover-trigger-width)]',
  independent:
    'w-[min(20rem,calc(100vw-1rem))] min-w-[min(16rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)]',
} satisfies Record<DataListPopoverSizing, DataListUiClass>

const dataListControlGeometryClasses = {
  xs: {
    text: 'text-xs',
    caption: 'text-[10px]',
    icon: 'size-3.5',
    smallIcon: 'size-3',
    panelGap: 'gap-3',
    fieldGap: 'gap-3',
    panelPadding: 'p-2',
    listPadding: 'p-1.5',
    row: 'gap-1.5 px-2 py-1 text-xs',
    footer: 'gap-2 px-3 py-2 text-xs',
    toolbarGap: 'gap-1.5',
    floating: 'gap-1.5 px-2.5 py-1.5 text-xs',
  },
  sm: {
    text: 'text-xs',
    caption: 'text-[10px]',
    icon: 'size-3.5',
    smallIcon: 'size-3',
    panelGap: 'gap-4',
    fieldGap: 'gap-4',
    panelPadding: 'p-2.5',
    listPadding: 'p-2',
    row: 'gap-2 px-2 py-1.5 text-xs',
    footer: 'gap-2.5 px-3 py-2.5 text-xs',
    toolbarGap: 'gap-2',
    floating: 'gap-2 px-3 py-2 text-xs',
  },
  md: {
    text: 'text-sm',
    caption: 'text-[11px]',
    icon: 'size-4',
    smallIcon: 'size-3.5',
    panelGap: 'gap-5',
    fieldGap: 'gap-5',
    panelPadding: 'p-3',
    listPadding: 'p-2',
    row: 'gap-2 px-2 py-1.5 text-sm',
    footer: 'gap-3 px-4 py-3 text-sm',
    toolbarGap: 'gap-2',
    floating: 'gap-2 px-3 py-2 text-sm',
  },
  lg: {
    text: 'text-sm',
    caption: 'text-xs',
    icon: 'size-4.5',
    smallIcon: 'size-4',
    panelGap: 'gap-6',
    fieldGap: 'gap-6',
    panelPadding: 'p-4',
    listPadding: 'p-2.5',
    row: 'gap-2.5 px-3 py-2 text-sm',
    footer: 'gap-3.5 px-5 py-3.5 text-sm',
    toolbarGap: 'gap-2.5',
    floating: 'gap-2.5 px-4 py-2.5 text-sm',
  },
  xl: {
    text: 'text-base',
    caption: 'text-xs',
    icon: 'size-5',
    smallIcon: 'size-4.5',
    panelGap: 'gap-7',
    fieldGap: 'gap-7',
    panelPadding: 'p-5',
    listPadding: 'p-3',
    row: 'gap-3 px-4 py-2.5 text-base',
    footer: 'gap-4 px-6 py-4 text-base',
    toolbarGap: 'gap-3',
    floating: 'gap-3 px-5 py-3 text-base',
  },
} satisfies Record<
  DataListControlSize,
  {
    text: DataListUiClass
    caption: DataListUiClass
    icon: DataListUiClass
    smallIcon: DataListUiClass
    panelGap: DataListUiClass
    fieldGap: DataListUiClass
    panelPadding: DataListUiClass
    listPadding: DataListUiClass
    row: DataListUiClass
    footer: DataListUiClass
    toolbarGap: DataListUiClass
    floating: DataListUiClass
  }
>

const dataListTableSizeClasses = {
  xs: {
    header: 'h-9 px-2.5 py-1 text-xs',
    row: 'h-9 min-h-9',
    cell: 'h-9 px-2.5 py-1.5 text-xs',
    rowHeight: 36,
  },
  sm: {
    header: 'h-10 px-3 py-1.5 text-xs',
    row: 'h-10 min-h-10',
    cell: 'h-10 px-3 py-2 text-xs',
    rowHeight: 40,
  },
  md: {
    header: 'h-12 px-4 py-2 text-sm',
    row: 'h-12 min-h-12',
    cell: 'h-12 px-4 py-2.5 text-sm',
    rowHeight: 48,
  },
  lg: {
    header: 'h-14 px-5 py-2.5 text-sm',
    row: 'h-14 min-h-14',
    cell: 'h-14 px-5 py-3 text-sm',
    rowHeight: 56,
  },
  xl: {
    header: 'h-16 px-6 py-3 text-sm',
    row: 'h-16 min-h-16',
    cell: 'h-16 px-6 py-3.5 text-sm',
    rowHeight: 64,
  },
} satisfies Record<
  DataListControlSize,
  { header: DataListUiClass; row: DataListUiClass; cell: DataListUiClass; rowHeight: number }
>

const dataListDensitySizes = {
  compact: 'sm',
  default: 'md',
  comfortable: 'lg',
} satisfies Record<DataListDensity, DataListControlSize>

/** Merges DataList slot classes with the same conflict resolution used by Nuxt UI. */
export function mergeDataListUiClass(
  defaults?: DataListUiClass,
  root?: DataListUiClass,
  local?: DataListUiClass,
) {
  return twMerge(defaults, root, local)
}

/** Resolves a table popover sizing mode while constraining nested panels to its container. */
export function resolveDataListPopoverContentClass(
  sizing: DataListPopoverSizing,
  local?: DataListUiClass,
) {
  return mergeDataListUiClass(
    `${dataListPopoverSizingClasses[sizing]} ${dataListPopoverContentClass}`,
    undefined,
    local,
  )
}

/** Maps a resolved control size to spacing, typography, and icon geometry. */
export function resolveDataListControlGeometry(size: DataListControlSize) {
  return dataListControlGeometryClasses[size]
}

const nestedControlSizes = {
  xs: 'xs',
  sm: 'xs',
  md: 'sm',
  lg: 'md',
  xl: 'lg',
} satisfies Record<DataListControlSize, DataListControlSize>

/** Downsizes controls nested inside another control, such as preview badges in filter tags. */
export function resolveDataListNestedControlSize(size: DataListControlSize) {
  return nestedControlSizes[size]
}

/** Maps the resolved DataList size to table header, row, cell, and skeleton geometry. */
export function resolveDataListTableSize(size: DataListControlSize) {
  return dataListTableSizeClasses[size]
}

/** Maps the legacy density fallback to the equivalent table size geometry. */
export function resolveDataListTableDensity(density: DataListDensity) {
  return dataListTableSizeClasses[dataListDensitySizes[density]]
}

/** Resolves the boundary owned by assembled content versus a granular content part. */
export function resolveDataListContentShellClass(options: {
  layout: 'table' | 'grid'
  surface: DataListContentSurface
}) {
  if (options.layout === 'grid') {
    if (options.surface === 'contained')
      return 'grid gap-5 overflow-hidden rounded-md border border-default bg-default'
    return 'grid gap-5'
  }
  if (options.surface === 'contained')
    return 'overflow-hidden rounded-md border border-default bg-default'
  return 'overflow-hidden'
}

/** Merges application and root DataList defaults without losing nested UI slots. */
export function mergeDataListUiConfig(
  appUi: DataListUiConfig | undefined,
  componentUi: DataListUiConfig | undefined,
  density: DataListDensity | undefined,
  size?: DataListControlSize,
): DataListUiConfig {
  return {
    ...appUi,
    ...componentUi,
    density: density ?? componentUi?.density ?? appUi?.density,
    control: (() => {
      const control = {
        ...appUi?.control,
        ...componentUi?.control,
      }
      if (size !== undefined) control.size = size
      return control
    })(),
    default: mergeUiConfig(appUi?.default, componentUi?.default),
    search: mergeSearchConfig(appUi?.search, componentUi?.search),
    filterTags: mergePartConfig(appUi?.filterTags, componentUi?.filterTags),
    addFilter: mergePartConfig(appUi?.addFilter, componentUi?.addFilter),
    filterPanel: mergePartConfig(appUi?.filterPanel, componentUi?.filterPanel),
    clearFilters: mergePartConfig(appUi?.clearFilters, componentUi?.clearFilters),
    resultCount: mergeUiConfig(appUi?.resultCount, componentUi?.resultCount),
    columnPanel: mergePartConfig(appUi?.columnPanel, componentUi?.columnPanel),
    sortMenu: mergePartConfig(appUi?.sortMenu, componentUi?.sortMenu),
    layoutSwitch: mergePartConfig(appUi?.layoutSwitch, componentUi?.layoutSwitch),
    refresh: mergePartConfig(appUi?.refresh, componentUi?.refresh),
    content: mergeUiConfig(appUi?.content, componentUi?.content),
    table: mergeUiConfig(appUi?.table, componentUi?.table),
    grid: mergeUiConfig(appUi?.grid, componentUi?.grid),
    pagination: mergePartConfig(appUi?.pagination, componentUi?.pagination),
    infiniteLoader: mergePartConfig(appUi?.infiniteLoader, componentUi?.infiniteLoader),
  }
}

function mergeUiConfig<TUi extends object>(
  appDefaults: { ui?: TUi } | undefined,
  componentConfig: { ui?: TUi } | undefined,
) {
  return {
    ...appDefaults,
    ...componentConfig,
    ui: { ...appDefaults?.ui, ...componentConfig?.ui },
  }
}

function mergePartConfig<TUi extends object>(
  appDefaults: DataListPartConfig<TUi> | undefined,
  componentConfig: DataListPartConfig<TUi> | undefined,
) {
  return {
    ...appDefaults,
    ...componentConfig,
    ui: { ...appDefaults?.ui, ...componentConfig?.ui },
  }
}

function mergeSearchConfig(
  appDefaults: DataListSearchConfig | undefined,
  componentConfig: DataListSearchConfig | undefined,
) {
  return {
    ...appDefaults,
    ...componentConfig,
    ui: { ...appDefaults?.ui, ...componentConfig?.ui },
  }
}
