import { twMerge } from 'tailwind-merge'

import type {
  DataListDensity,
  DataListPartConfig,
  DataListSearchConfig,
  DataListUiClass,
  DataListUiConfig,
} from '../types'

/** Merges DataList slot classes with the same conflict resolution used by Nuxt UI. */
export function mergeDataListUiClass(
  defaults?: DataListUiClass,
  root?: DataListUiClass,
  local?: DataListUiClass,
) {
  return twMerge(defaults, root, local)
}

/** Merges application and root DataList defaults without losing nested UI slots. */
export function mergeDataListUiConfig(
  appUi: DataListUiConfig | undefined,
  componentUi: DataListUiConfig | undefined,
  density: DataListDensity | undefined,
): DataListUiConfig {
  return {
    ...appUi,
    ...componentUi,
    density: density ?? componentUi?.density ?? appUi?.density,
    control: { ...appUi?.control, ...componentUi?.control },
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
