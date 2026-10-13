import { isObject, isString } from '../../shared/utils/predicate'
import { DATA_LIST_MOBILE_DEFAULTS } from '../constants/mobile'
import type { DataListUiClass, DataListUiConfig, TableRuntimeRecord } from '../types'
import { mergeDataListUiClass } from './data-list-ui'

/** The classes the registry adds to the slots of one part. */
type SlotClasses = Partial<Record<string, DataListUiClass>>

function isClassEntry(entry: [string, unknown]): entry is [string, DataListUiClass] {
  return isString(entry[1])
}

/** What the config holds for a part, or nothing when the app set nothing there. */
function readPart(config: DataListUiConfig, name: string): TableRuntimeRecord {
  const part = new Map(Object.entries(config)).get(name)
  return isObject(part) ? part : {}
}

/** One part of the config with the package's classes under the classes its slots already carry. */
function layerPart(config: DataListUiConfig, name: string, defaults: SlotClasses) {
  const own = readPart(config, name)
  const ui: TableRuntimeRecord = isObject(own.ui) ? own.ui : {}
  const classes = new Map(Object.entries(ui).filter(isClassEntry))
  const added = Object.entries(defaults)
    .filter(isClassEntry)
    .map(
      ([slot, base]) => [slot, mergeDataListUiClass(base, undefined, classes.get(slot))] as const,
    )
  return { ...own, ui: { ...ui, ...Object.fromEntries(added) } }
}

/**
 * Adds the package's mobile defaults to a config: a 44px touch target on every control a thumb
 * reaches. Their classes go under the classes each slot already has, so an app's own slot classes
 * are kept and win wherever they conflict.
 */
export function layerDataListMobileDefaults(config: DataListUiConfig): DataListUiConfig {
  const layered = Object.entries(DATA_LIST_MOBILE_DEFAULTS).map(
    ([name, defaults]) => [name, layerPart(config, name, defaults.ui)] as const,
  )
  return Object.assign({}, config, Object.fromEntries(layered))
}
