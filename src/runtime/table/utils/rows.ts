import { isObject } from '../../shared/utils/predicate'
import type { GenericObject, TableRowKey } from '../types'

type PathReadableRecord = import('../../shared/types/utils').GenericObject

export function resolveTableRowId(options: {
  rowKey: TableRowKey<GenericObject>
  row: unknown
  index?: number
}) {
  if (Array.isArray(options.rowKey)) {
    return (
      options.rowKey
        .map((key) => String(getTableRowValue({ row: options.row, path: key }) ?? ''))
        .join('::') || String(options.index ?? 0)
    )
  }

  return String(getTableRowValue({ row: options.row, path: options.rowKey }) ?? options.index ?? 0)
}

export function getTableRowValue<TValue>(options: { row: TValue; path: string }) {
  return options.path.split('.').reduce<unknown>((value, key) => {
    if (!isPathReadableRecord(value)) {
      return undefined
    }

    return value[key]
  }, options.row)
}

function isPathReadableRecord<TValue>(value: TValue): value is TValue & PathReadableRecord {
  return isObject(value)
}
