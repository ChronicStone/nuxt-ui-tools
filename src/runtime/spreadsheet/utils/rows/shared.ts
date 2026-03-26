import type {
  SpreadsheetColumnDefinition,
  SpreadsheetDynamicCollectionItemDefinition,
  SpreadsheetDynamicCollectionDefinition,
  SpreadsheetDynamicOptionGroupsDefinition,
} from '../../types'
import type {
  SpreadsheetCellValue,
  SpreadsheetRowIssue,
  SpreadsheetStaticColumn,
  SpreadsheetStaticColumnGroup,
} from '../../types'
import { isSpreadsheetRecord } from '../object'

export function normalizeSpreadsheetText(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s*\*\s*$/g, '')
    .replace(/\s*\(required\)\s*$/gi, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

export function applySpreadsheetNormalization(
  value: unknown,
  normalize: readonly string[] | undefined,
) {
  const nextValue = String(value ?? '').trim()
  if (!normalize?.length) return nextValue

  return normalize.reduce((result, token) => {
    if (token === 'trim') return result.trim()
    if (token === 'case-insensitive') return result.toLowerCase()
    if (token === 'accent-insensitive')
      return result.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

    return result
  }, nextValue)
    .replace(/\s*\*\s*$/g, '')
    .replace(/\s*\(required\)\s*$/gi, '')
}

export function isSpreadsheetStaticColumn(value: unknown): value is SpreadsheetStaticColumn {
  return isSpreadsheetRecord(value) && 'kind' in value && value.kind !== 'group' && 'key' in value
}

export function isSpreadsheetColumnGroup(value: unknown): value is SpreadsheetStaticColumnGroup {
  return isSpreadsheetRecord(value) && 'kind' in value && value.kind === 'group' && 'columns' in value
}

export function isSpreadsheetDynamicOptionGroupsColumn(
  value: unknown,
): value is SpreadsheetDynamicOptionGroupsDefinition<string, string, unknown> {
  return isSpreadsheetRecord(value) && 'kind' in value && value.kind === 'option-groups'
}

export function isSpreadsheetDynamicCollectionColumn(
  value: unknown,
): value is SpreadsheetDynamicCollectionDefinition<string, 'array' | 'record'> {
  return isSpreadsheetRecord(value) && 'kind' in value && value.kind === 'collection'
}

export function isSpreadsheetDynamicCollectionItem(
  value: unknown,
): value is SpreadsheetDynamicCollectionItemDefinition {
  return isSpreadsheetRecord(value) && 'id' in value && 'match' in value && 'value' in value
}

export async function parseSpreadsheetCellValue<TContext>(
  column: SpreadsheetColumnDefinition<string, unknown, boolean, TContext>,
  cell: SpreadsheetCellValue,
  context: TContext,
  issues: SpreadsheetRowIssue[],
) {
  const isEmpty = cell.text.trim() === ''

  if (column.required && isEmpty) {
    issues.push({
      level: 'error',
      code: 'cell.required',
      message: `Missing required value for "${column.key}"`,
      rowIndex: cell.rowIndex,
      columnKey: column.key,
      columnIndex: cell.columnIndex,
      header: cell.header,
    })
  }

  if (isEmpty && !column.parse) return undefined

  try {
    const value = column.parse
      ? await column.parse({ cell, context })
      : cell.text

    if (column.validate) {
      await column.validate({
        value,
        context,
        addIssue: (level, code, message) => {
          issues.push({
            level,
            code,
            message,
            rowIndex: cell.rowIndex,
            columnKey: column.key,
            columnIndex: cell.columnIndex,
            header: cell.header,
          })
        },
      })
    }

    return value
  } catch (error) {
    issues.push({
      level: 'error',
      code: 'cell.parse_failed',
      message: error instanceof Error
        ? error.message
        : `Failed to parse "${column.key}"`,
      rowIndex: cell.rowIndex,
      columnKey: column.key,
      columnIndex: cell.columnIndex,
      header: cell.header,
    })

    return undefined
  }
}
