import type { DataListUiConfig } from '../types'

/** A 44px tap target, the smallest size a thumb hits reliably. */
const TOUCH_TARGET = 'min-h-11 min-w-11'

/**
 * A 44px tap area centred on a control that keeps its drawn size, such as a 16px checkbox, so the
 * table's rows and columns do not move.
 */
const TOUCH_AREA =
  'relative before:absolute before:top-1/2 before:left-1/2 before:size-11 before:-translate-x-1/2 before:-translate-y-1/2'

/**
 * The classes the package adds below the `md` breakpoint, so every control a thumb reaches has a
 * 44px tap target. `layerDataListMobileDefaults` puts them under the classes a slot already has,
 * which keeps the app's own slot classes and lets them win where they conflict. Desktop sizing is
 * untouched.
 */
export const DATA_LIST_MOBILE_DEFAULTS = {
  columnPanel: { ui: { trigger: TOUCH_TARGET } },
  content: { ui: { retry: TOUCH_TARGET } },
  filterPanel: { ui: { trigger: TOUCH_TARGET } },
  filterTags: { ui: { sheetTrigger: TOUCH_TARGET } },
  infiniteLoader: { ui: { loadMore: TOUCH_TARGET, retry: TOUCH_TARGET } },
  layoutSwitch: { ui: { trigger: TOUCH_TARGET } },
  pagination: { ui: { button: TOUCH_TARGET } },
  refresh: { ui: { base: TOUCH_TARGET } },
  search: { ui: { base: 'min-h-11', clear: TOUCH_TARGET } },
  sortMenu: { ui: { trigger: TOUCH_TARGET } },
  table: { ui: { emptyAction: TOUCH_TARGET, rowAction: TOUCH_TARGET, selectControl: TOUCH_AREA } },
  viewToggle: { ui: { base: TOUCH_TARGET } },
} as const satisfies NonNullable<DataListUiConfig['mobile']>
