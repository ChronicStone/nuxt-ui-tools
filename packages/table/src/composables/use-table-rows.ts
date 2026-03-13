import { computed } from 'vue'

export function useTableRows(options: {
  schema: any
  rows: any
}) {
  return computed(() =>
    options.rows.value.map((row: Record<string, any>, index: number) => ({
      ...row,
      __$rowIndex: index,
      __$rowId: resolveRowId({
        rowKey: options.schema.value.rowKey,
        row,
        index,
      }),
    })),
  )
}

function resolveRowId(options: {
  rowKey: string | string[]
  row: Record<string, any>
  index: number
}) {
  if (Array.isArray(options.rowKey)) {
    return options.rowKey
      .map((key) => String(getPathValue({ row: options.row, path: key }) ?? ''))
      .join('::') || String(options.index)
  }

  return String(getPathValue({ row: options.row, path: options.rowKey }) ?? options.index)
}

function getPathValue(options: {
  row: Record<string, any>
  path: string
}) {
  return options.path.split('.').reduce<unknown>((value, key) => {
    if (value == null) {
      return undefined
    }

    return (value as Record<string, unknown>)[key]
  }, options.row)
}
