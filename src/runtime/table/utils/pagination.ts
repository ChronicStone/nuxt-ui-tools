import type {
  GenericObject,
  TableCursorPageResult,
  TableExternalState,
  TableSchemaView,
} from '../types'
import { resolveTableRowId } from './rows'

export function isTableCursorPageResult(value: unknown): value is TableCursorPageResult {
  if (!value || typeof value !== 'object') return false
  if (!('rows' in value) || !('pageInfo' in value)) return false
  if (!Array.isArray(value.rows) || !value.pageInfo || typeof value.pageInfo !== 'object')
    return false
  if (!('mode' in value.pageInfo)) return false

  return value.pageInfo.mode === 'cursor'
}

export function flattenTableCursorPages(options: {
  pages: readonly unknown[]
  rowKey: TableSchemaView['rowKey']
}): TableExternalState {
  const rows = new Map<string, GenericObject>()
  let rowCount: number | null = null

  for (const page of options.pages) {
    if (!isTableCursorPageResult(page)) continue

    for (const [index, row] of page.rows.entries())
      rows.set(resolveTableRowId({ rowKey: options.rowKey, row, index }), row)

    rowCount = page.pageInfo.rowCount
  }

  return { rows: [...rows.values()], rowCount }
}
