import type { GenericObject, TableRowKey } from '../types'

type PathReadableRecord = Record<string, unknown>

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

export function getTableRowValue(options: { row: unknown; path: string }) {
  return options.path.split('.').reduce<unknown>((value, key) => {
    if (!isPathReadableRecord(value)) {
      return undefined
    }

    return value[key]
  }, options.row)
}

function isPathReadableRecord(value: unknown): value is PathReadableRecord {
  return value !== null && typeof value === 'object'
}
