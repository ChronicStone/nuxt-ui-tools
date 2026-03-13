import { computed } from 'vue'
import { resolveTableRowId } from '../utils'

export function useTableRows(options: {
  schema: any
  rows: any
}) {
  return computed(() =>
    options.rows.value.map((row: Record<string, any>, index: number) => ({
      ...row,
      __$rowIndex: index,
      __$rowId: resolveTableRowId({
        rowKey: options.schema.value.rowKey,
        row,
        index,
      }),
    })),
  )
}
