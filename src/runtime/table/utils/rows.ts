import type { TableRowKey } from '../types'

export function resolveTableRowId(options: {
  rowKey: TableRowKey<any>
  row: Record<string, any>
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

export function getTableRowValue(options: { row: Record<string, any>; path: string }) {
  return options.path.split('.').reduce<unknown>((value, key) => {
    if (value == null) {
      return undefined
    }

    return (value as Record<string, unknown>)[key]
  }, options.row)
}
