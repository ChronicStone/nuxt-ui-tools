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
  independent:
    'w-[min(20rem,calc(100vw-1rem))] min-w-[min(16rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)]',
  trigger:
    'w-[var(--reka-popover-trigger-width)] min-w-[var(--reka-popover-trigger-width)] max-w-[var(--reka-popover-trigger-width)]',
} satisfies Record<DataListPopoverSizing, DataListUiClass>

const dataListControlGeometryClasses = {
  lg: {
    caption: 'text-xs',
    fieldGap: 'gap-6',
    floating: 'gap-2.5 px-4 py-2.5 text-sm',
    footer: 'gap-3.5 px-5 py-3.5 text-sm',
    icon: 'size-4.5',
    listPadding: 'p-2.5',
    panelGap: 'gap-6',
    panelPadding: 'p-4',
    row: 'gap-2.5 px-3 py-2 text-sm',
    smallIcon: 'size-4',
    text: 'text-sm',
    toolbarGap: 'gap-2.5',
  },
  md: {
    caption: 'text-[11px]',
    fieldGap: 'gap-5',
    floating: 'gap-2 px-3 py-2 text-sm',
    footer: 'gap-3 px-4 py-3 text-sm',
    icon: 'size-4',
    listPadding: 'p-2',
    panelGap: 'gap-5',
    panelPadding: 'p-3',
    row: 'gap-2 px-2 py-1.5 text-sm',
    smallIcon: 'size-3.5',
    text: 'text-sm',
    toolbarGap: 'gap-2',
  },
  sm: {
    caption: 'text-[10px]',
    fieldGap: 'gap-4',
    floating: 'gap-2 px-3 py-2 text-xs',
    footer: 'gap-2.5 px-3 py-2.5 text-xs',
    icon: 'size-3.5',
    listPadding: 'p-2',
    panelGap: 'gap-4',
    panelPadding: 'p-2.5',
    row: 'gap-2 px-2 py-1.5 text-xs',
    smallIcon: 'size-3',
    text: 'text-xs',
    toolbarGap: 'gap-2',
  },
  xl: {
    caption: 'text-xs',
    fieldGap: 'gap-7',
    floating: 'gap-3 px-5 py-3 text-base',
    footer: 'gap-4 px-6 py-4 text-base',
    icon: 'size-5',
    listPadding: 'p-3',
    panelGap: 'gap-7',
    panelPadding: 'p-5',
    row: 'gap-3 px-4 py-2.5 text-base',
    smallIcon: 'size-4.5',
    text: 'text-base',
    toolbarGap: 'gap-3',
  },
  xs: {
    caption: 'text-[10px]',
    fieldGap: 'gap-3',
    floating: 'gap-1.5 px-2.5 py-1.5 text-xs',
    footer: 'gap-2 px-3 py-2 text-xs',
    icon: 'size-3.5',
    listPadding: 'p-1.5',
    panelGap: 'gap-3',
    panelPadding: 'p-2',
    row: 'gap-1.5 px-2 py-1 text-xs',
    smallIcon: 'size-3',
    text: 'text-xs',
    toolbarGap: 'gap-1.5',
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
  lg: {
    cell: 'h-14 px-5 py-3 text-sm',
    header: 'h-14 px-5 py-2.5 text-sm',
    row: 'h-14 min-h-14',
    rowHeight: 56,
  },
  md: {
    cell: 'h-12 px-4 py-2.5 text-sm',
    header: 'h-12 px-4 py-2 text-sm',
    row: 'h-12 min-h-12',
    rowHeight: 48,
  },
  sm: {
    cell: 'h-10 px-3 py-2 text-xs',
    header: 'h-10 px-3 py-1.5 text-xs',
    row: 'h-10 min-h-10',
    rowHeight: 40,
  },
  xl: {
    cell: 'h-16 px-6 py-3.5 text-sm',
    header: 'h-16 px-6 py-3 text-sm',
    row: 'h-16 min-h-16',
    rowHeight: 64,
  },
  xs: {
    cell: 'h-9 px-2.5 py-1.5 text-xs',
    header: 'h-9 px-2.5 py-1 text-xs',
    row: 'h-9 min-h-9',
    rowHeight: 36,
  },
} satisfies Record<
  DataListControlSize,
  { header: DataListUiClass; row: DataListUiClass; cell: DataListUiClass; rowHeight: number }
>

const dataListDensitySizes = {
  comfortable: 'lg',
  compact: 'sm',
  default: 'md',
} satisfies Record<DataListDensity, DataListControlSize>

type PropsRecord = Record<string, unknown>

function isPlainRecord(value: unknown): value is PropsRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Merges control prop layers: later layers win, nested control objects merge one level deep. */
export function mergeDataListProps<TProps extends object>(
  ...layers: (TProps | undefined)[]
): TProps {
  const out: PropsRecord = {}
  for (const layer of layers) {
    if (!layer) {
      continue
    }
    for (const [key, value] of Object.entries(layer)) {
      if (value === undefined) {
        continue
      }
      const current = out[key]
      out[key] = isPlainRecord(current) && isPlainRecord(value) ? { ...current, ...value } : value
    }
  }
  return out as TProps
}

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
  lg: 'md',
  md: 'sm',
  sm: 'xs',
  xl: 'lg',
  xs: 'xs',
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
    if (options.surface === 'contained') {
      return 'grid gap-5 overflow-hidden rounded-md border border-default bg-default'
    }
    return 'grid gap-5'
  }
  if (options.surface === 'contained') {
    return 'overflow-hidden rounded-md border border-default bg-default'
  }
  return 'overflow-hidden'
}

/** Merges application and root DataList defaults without losing nested UI slots. */
export function mergeDataListUiConfig(
  appUi: DataListUiConfig | undefined,
  componentUi: DataListUiConfig | undefined,
  density?: DataListDensity,
  size?: DataListControlSize,
): DataListUiConfig {
  return {
    ...appUi,
    ...componentUi,
    addFilter: mergePartConfig(appUi?.addFilter, componentUi?.addFilter),
    clearFilters: mergePartConfig(appUi?.clearFilters, componentUi?.clearFilters),
    columnPanel: mergePartConfig(appUi?.columnPanel, componentUi?.columnPanel),
    content: mergeUiConfig(appUi?.content, componentUi?.content),
    control: (() => {
      const control = {
        ...appUi?.control,
        ...componentUi?.control,
      }
      if (size !== undefined) control.size = size
      return control
    })(),
    default: mergeUiConfig(appUi?.default, componentUi?.default),
    density: density ?? componentUi?.density ?? appUi?.density,
    filterPanel: mergePartConfig(appUi?.filterPanel, componentUi?.filterPanel),
    filterTags: mergePartConfig(appUi?.filterTags, componentUi?.filterTags),
    grid: mergeUiConfig(appUi?.grid, componentUi?.grid),
    infiniteLoader: mergePartConfig(appUi?.infiniteLoader, componentUi?.infiniteLoader),
    layoutSwitch: mergePartConfig(appUi?.layoutSwitch, componentUi?.layoutSwitch),
    pagination: mergePartConfig(appUi?.pagination, componentUi?.pagination),
    refresh: mergePartConfig(appUi?.refresh, componentUi?.refresh),
    resultCount: mergeUiConfig(appUi?.resultCount, componentUi?.resultCount),
    search: mergeSearchConfig(appUi?.search, componentUi?.search),
    selectionActions: mergePartConfig(appUi?.selectionActions, componentUi?.selectionActions),
    sortMenu: mergePartConfig(appUi?.sortMenu, componentUi?.sortMenu),
    table: mergeUiConfig(appUi?.table, componentUi?.table),
  }
}

function mergeUiConfig<TUi extends object, TProps extends object>(
  appDefaults: { ui?: TUi; props?: TProps } | undefined,
  componentConfig: { ui?: TUi; props?: TProps } | undefined,
) {
  return {
    ...appDefaults,
    ...componentConfig,
    props: mergeDataListProps(appDefaults?.props, componentConfig?.props),
    ui: { ...appDefaults?.ui, ...componentConfig?.ui },
  }
}

function mergePartConfig<TUi extends object, TProps extends object>(
  appDefaults: DataListPartConfig<TUi, TProps> | undefined,
  componentConfig: DataListPartConfig<TUi, TProps> | undefined,
) {
  return mergeUiConfig(appDefaults, componentConfig)
}

function mergeSearchConfig(
  appDefaults: DataListSearchConfig | undefined,
  componentConfig: DataListSearchConfig | undefined,
) {
  return mergeUiConfig(appDefaults, componentConfig)
}
