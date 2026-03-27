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
import { executeSpreadsheetRules } from '../validation'

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

function isSpreadsheetOptionResolver(value: unknown): value is (params: {
  context: unknown
}) => readonly unknown[] {
  return typeof value === 'function'
}

function isSpreadsheetOptionConfig(value: unknown): value is {
  resolve: readonly unknown[] | ((params: { context: unknown }) => readonly unknown[])
  optionLabel?: (option: unknown) => string
  optionValue?: (option: unknown) => unknown
} {
  return isSpreadsheetRecord(value) && 'resolve' in value
}

function resolveSpreadsheetColumnOptionEntries<TContext>(
  options: unknown,
  context: TContext,
) {
  if (Array.isArray(options)) return options
  if (isSpreadsheetOptionResolver(options)) return options({ context })
  if (!isSpreadsheetOptionConfig(options)) return []
  if (Array.isArray(options.resolve)) return options.resolve
  if (isSpreadsheetOptionResolver(options.resolve)) return options.resolve({ context })

  return []
}

function resolveSpreadsheetColumnOptionLabel(
  option: unknown,
  options: unknown,
) {
  if (isSpreadsheetOptionConfig(options) && options.optionLabel)
    return options.optionLabel(option)
  if (!isSpreadsheetRecord(option) || typeof option.label !== 'string') return ''

  return option.label
}

function resolveSpreadsheetColumnOptionValue(
  option: unknown,
  options: unknown,
) {
  if (isSpreadsheetOptionConfig(options) && options.optionValue)
    return options.optionValue(option)
  if (!isSpreadsheetRecord(option) || !('value' in option)) return undefined

  return option.value
}

function resolveSpreadsheetMultipleConfig(
  multiple: SpreadsheetColumnDefinition['multiple'],
) {
  if (!multiple) return undefined
  if (multiple === true) return {}

  return multiple
}

function splitSpreadsheetMultipleTokens(value: string, separator: string | undefined) {
  return value
    .split(separator ?? ',')
    .map(entry => entry.trim())
    .filter(Boolean)
}

function parseSpreadsheetNumberValue(value: string) {
  const nextValue = Number(value)
  if (Number.isNaN(nextValue) || !Number.isFinite(nextValue)) return undefined

  return nextValue
}

function parseSpreadsheetBooleanValue(value: string) {
  const normalized = value.toLowerCase()
  if (['true', '1', 'yes'].includes(normalized)) return true
  if (['false', '0', 'no'].includes(normalized)) return false

  return undefined
}

function pushSpreadsheetParseIssue(params: {
  issues: SpreadsheetRowIssue[]
  rowIndex: number
  columnKey: string
  columnIndex: number
  header: string
  code: string
  message: string
}) {
  params.issues.push({
    level: 'error',
    code: params.code,
    message: params.message,
    rowIndex: params.rowIndex,
    columnKey: params.columnKey,
    columnIndex: params.columnIndex,
    header: params.header,
  })
}

function parseSpreadsheetEnumColumnValue<TContext>(
  column: SpreadsheetColumnDefinition<string, unknown, boolean, TContext> & {
    kind: 'enum'
    options: readonly unknown[]
  },
  token: string,
  cell: SpreadsheetCellValue,
  issues: SpreadsheetRowIssue[],
) {
  if (!token) return undefined

  const multipleConfig = resolveSpreadsheetMultipleConfig(column.multiple)
  const normalizedToken = multipleConfig?.normalize
    ? applySpreadsheetNormalization(token, multipleConfig.normalize)
    : token

  const match = column.options.find((option) => {
    const candidate = String(option)
    if (!multipleConfig?.normalize) return candidate === token

    return applySpreadsheetNormalization(candidate, multipleConfig.normalize) === normalizedToken
  })
  if (match !== undefined) return match

  pushSpreadsheetParseIssue({
    issues,
    code: 'enum.not_found',
    message: `Unknown enum value "${token}"`,
    rowIndex: cell.rowIndex,
    columnKey: column.key,
    columnIndex: cell.columnIndex,
    header: cell.header,
  })

  return undefined
}

function parseSpreadsheetOptionColumnValue<TContext>(
  column: SpreadsheetColumnDefinition<string, unknown, boolean, TContext> & {
    kind: 'option'
    options: unknown
  },
  token: string,
  cell: SpreadsheetCellValue,
  context: TContext,
  issues: SpreadsheetRowIssue[],
) {
  if (!token) return undefined

  const options = resolveSpreadsheetColumnOptionEntries(column.options, context)
  const multipleConfig = resolveSpreadsheetMultipleConfig(column.multiple)
  const normalizedToken = multipleConfig?.normalize
    ? applySpreadsheetNormalization(token, multipleConfig.normalize)
    : token
  const match = options.find((option) => {
    const label = resolveSpreadsheetColumnOptionLabel(option, column.options)
    const value = resolveSpreadsheetColumnOptionValue(option, column.options)
    const by = multipleConfig?.matchBy

    if (by === 'label')
      return (multipleConfig?.normalize
        ? applySpreadsheetNormalization(label, multipleConfig.normalize)
        : label) === normalizedToken

    if (by === 'value')
      return (multipleConfig?.normalize
        ? applySpreadsheetNormalization(String(value ?? ''), multipleConfig.normalize)
        : String(value ?? '')) === normalizedToken

    return token === label || token === String(value ?? '')
  })

  if (match === undefined) {
    pushSpreadsheetParseIssue({
      issues,
      code: 'option.not_found',
      message: `Unknown option "${token}"`,
      rowIndex: cell.rowIndex,
      columnKey: column.key,
      columnIndex: cell.columnIndex,
      header: cell.header,
    })

    return undefined
  }

  return resolveSpreadsheetColumnOptionValue(match, column.options)
}

function isSpreadsheetEnumColumn<TContext>(
  column: SpreadsheetColumnDefinition<string, unknown, boolean, TContext>,
): column is SpreadsheetColumnDefinition<string, unknown, boolean, TContext> & {
  kind: 'enum'
  options: readonly unknown[]
} {
  return column.kind === 'enum' && 'options' in column && Array.isArray(column.options)
}

function isSpreadsheetOptionColumn<TContext>(
  column: SpreadsheetColumnDefinition<string, unknown, boolean, TContext>,
): column is SpreadsheetColumnDefinition<string, unknown, boolean, TContext> & {
  kind: 'option'
  options: unknown
} {
  return column.kind === 'option' && 'options' in column
}

function parseSpreadsheetSingleBuiltInValue<TContext>(
  column: SpreadsheetColumnDefinition<string, unknown, boolean, TContext>,
  token: string,
  cell: SpreadsheetCellValue,
  context: TContext,
  issues: SpreadsheetRowIssue[],
) {
  if (column.kind === 'text' || column.kind === 'email' || column.kind === 'date')
    return token
  if (column.kind === 'number') {
    const value = parseSpreadsheetNumberValue(token)
    if (value !== undefined) return value

    pushSpreadsheetParseIssue({
      issues,
      code: 'number.invalid',
      message: `Invalid number "${token}"`,
      rowIndex: cell.rowIndex,
      columnKey: column.key,
      columnIndex: cell.columnIndex,
      header: cell.header,
    })
    return undefined
  }
  if (column.kind === 'boolean') {
    const value = parseSpreadsheetBooleanValue(token)
    if (value !== undefined) return value

    pushSpreadsheetParseIssue({
      issues,
      code: 'boolean.invalid',
      message: `Invalid boolean "${token}"`,
      rowIndex: cell.rowIndex,
      columnKey: column.key,
      columnIndex: cell.columnIndex,
      header: cell.header,
    })
    return undefined
  }
  if (isSpreadsheetEnumColumn(column))
    return parseSpreadsheetEnumColumnValue(column, token, cell, issues)
  if (isSpreadsheetOptionColumn(column))
    return parseSpreadsheetOptionColumnValue(column, token, cell, context, issues)

  return token
}

function parseSpreadsheetBuiltInCellValue<TContext>(
  column: SpreadsheetColumnDefinition<string, unknown, boolean, TContext>,
  cell: SpreadsheetCellValue,
  context: TContext,
  issues: SpreadsheetRowIssue[],
) {
  const multipleConfig = resolveSpreadsheetMultipleConfig(column.multiple)
  if (!multipleConfig)
    return parseSpreadsheetSingleBuiltInValue(column, cell.text, cell, context, issues)

  if (!cell.text) return []

  return splitSpreadsheetMultipleTokens(cell.text, multipleConfig.separator)
    .flatMap((token) => {
      const value = parseSpreadsheetSingleBuiltInValue(column, token, cell, context, issues)
      return value === undefined ? [] : [value]
    })
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

  try {
    const value = column.parse
      ? await column.parse({ cell, context })
      : parseSpreadsheetBuiltInCellValue(column, cell, context, issues)

    const validationIssues = executeSpreadsheetRules({
      value,
      rules: column.rules,
    })

    issues.push(...validationIssues.map((issue: {
      ruleKey?: string
      level: 'error' | 'warning' | 'info'
      code: string
      message: string
    }) => ({
      ...issue,
      rowIndex: cell.rowIndex,
      columnKey: column.key,
      columnIndex: cell.columnIndex,
      header: cell.header,
    })))

    if (isEmpty && !column.parse) return undefined
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
