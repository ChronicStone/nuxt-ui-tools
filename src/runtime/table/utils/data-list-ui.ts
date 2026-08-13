import { twMerge } from 'tailwind-merge'

import type { DataListUiClass } from '../types'

/** Merges DataList slot classes with the same conflict resolution used by Nuxt UI. */
export function mergeDataListUiClass(
  defaults?: DataListUiClass,
  root?: DataListUiClass,
  local?: DataListUiClass,
) {
  return twMerge(defaults, root, local)
}
