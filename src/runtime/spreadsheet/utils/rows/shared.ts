import { useUiToolsLocale } from '#ui-tools/i18n'

import type {
  SpreadsheetColumnDefinition,
  SpreadsheetDynamicCollectionItemDefinition,
  SpreadsheetDynamicCollectionDefinition,
  SpreadsheetDynamicOptionGroupsDefinition,
  SpreadsheetCellValue,
  SpreadsheetModifier,
  SpreadsheetRowIssue,
  SpreadsheetStaticColumn,
  SpreadsheetStaticColumnGroup,
  SpreadsheetValue,
} from '../../types'
import { isSpreadsheetRecord } from '../object'
import {
  getSpreadsheetOptionLabel,
  getSpreadsheetOptionValue,
  resolveSpreadsheetOptionEntries,
} from '../options'
import { executeSpreadsheetRules } from '../validation'

export function normalizeSpreadsheetText(value: SpreadsheetValue) {
  return String(value ?? '')
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036F]/gu, '')
    .replaceAll(/\s*\*\s*$/gu, '')
    .replaceAll(/\s*\(required\)\s*$/giu, '')
    .trim()
    .replaceAll(/\s+/gu, ' ')
    .toLowerCase()
}

export function applySpreadsheetNormalization(
  value: SpreadsheetValue,
  normalize: readonly SpreadsheetModifier[] | undefined,
) {
  const nextValue = String(value ?? '').trim()
  if (!normalize?.length) {
    return nextValue
  }

  return normalize
    .reduce((result, token) => {
      if (token === 'trim') {
        return result.trim()
      }
      if (token === 'case-insensitive') {
        return result.toLowerCase()
      }
      if (token === 'accent-insensitive') {
        return result.normalize('NFD').replace(/[\u0300-\u036f]/gu, '')
      }

      return result
    }, nextValue)
    .replaceAll(/\s*\*\s*$/gu, '')
    .replaceAll(/\s*\(required\)\s*$/giu, '')
}

export function applySpreadsheetModifiers(
  value: SpreadsheetValue,
  modifiers: readonly string[] | undefined,
) {
  const nextValue = String(value ?? '')
  if (!modifiers?.length) {
    return nextValue
  }

  return modifiers.reduce((result, modifier) => {
    if (modifier === 'trim') {
      return result.trim()
    }
    if (modifier === 'lowercase' || modifier === 'case-insensitive') {
      return result.toLowerCase()
    }
    if (modifier === 'uppercase') {
      return result.toUpperCase()
    }
    if (modifier === 'normalizeSpaces') {
      return result.replace(/\s+/gu, ' ')
    }
    if (modifier === 'accent-insensitive') {
      return result.normalize('NFD').replace(/[\u0300-\u036f]/gu, '')
    }

    return result
  }, nextValue)
}

export function isSpreadsheetStaticColumn(
  value: SpreadsheetValue,
): value is SpreadsheetStaticColumn {
  return isSpreadsheetRecord(value) && 'kind' in value && value.kind !== 'group' && 'key' in value
}

export function isSpreadsheetColumnGroup(
  value: SpreadsheetValue,
): value is SpreadsheetStaticColumnGroup {
  return (
    isSpreadsheetRecord(value) && 'kind' in value && value.kind === 'group' && 'columns' in value
  )
}

export function isSpreadsheetDynamicOptionGroupsColumn(
  value: SpreadsheetValue,
): value is SpreadsheetDynamicOptionGroupsDefinition<string, string, unknown> {
  return isSpreadsheetRecord(value) && 'kind' in value && value.kind === 'option-groups'
}

export function isSpreadsheetDynamicCollectionColumn(
  value: SpreadsheetValue,
): value is SpreadsheetDynamicCollectionDefinition<string, 'array' | 'record'> {
  return isSpreadsheetRecord(value) && 'kind' in value && value.kind === 'collection'
}

export function isSpreadsheetDynamicCollectionItem(
  value: SpreadsheetValue,
): value is SpreadsheetDynamicCollectionItemDefinition {
  return isSpreadsheetRecord(value) && 'id' in value && 'match' in value && 'value' in value
}

function hasSpreadsheetColumnResolve<TContext>(
  column: SpreadsheetColumnDefinition<string, unknown, boolean, TContext>,
) {
  return 'resolve' in column && Boolean(column.resolve)
}

function resolveSpreadsheetColumnOptionEntries<TContext>(
  options: SpreadsheetValue,
  context: TContext,
) {
  return resolveSpreadsheetOptionEntries(options, { context })
}

function resolveSpreadsheetMultipleConfig(
  multiple: SpreadsheetColumnDefinition['multiple'],
): Exclude<SpreadsheetColumnDefinition['multiple'], boolean | undefined> | undefined {
  if (!multiple) {
    return undefined
  }
  if (multiple === true) {
    return {}
  }

  return multiple
}

function splitSpreadsheetMultipleTokens(value: string, separator: string | undefined) {
  return value
    .split(separator ?? ',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function parseSpreadsheetNumberValue(value: string) {
  const nextValue = Number(value)
  if (Number.isNaN(nextValue) || !Number.isFinite(nextValue)) {
    return undefined
  }

  return nextValue
}

function parseSpreadsheetBooleanValue(value: string) {
  const normalized = value.toLowerCase()
  if (['true', '1', 'yes'].includes(normalized)) {
    return true
  }
  if (['false', '0', 'no'].includes(normalized)) {
    return false
  }
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
    code: params.code,
    columnIndex: params.columnIndex,
    columnKey: params.columnKey,
    header: params.header,
    level: 'error',
    message: params.message,
    rowIndex: params.rowIndex,
  })
}

export function getSpreadsheetIssueText() {
  const { t } = useUiToolsLocale()

  return {
    invalidBooleanInput: (value: string) =>
      t('spreadsheet.validation.invalidBooleanInput', { value }),
    invalidNumberInput: (value: string) =>
      t('spreadsheet.validation.invalidNumberInput', { value }),
    missingValue: (field: string) => t('spreadsheet.validation.missingValue', { field }),
    parseFailed: (field: string) => t('spreadsheet.validation.parseFailed', { field }),
    unrecognizedValue: (value: string) => t('spreadsheet.validation.unrecognizedValue', { value }),
  }
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
  const issueText = getSpreadsheetIssueText()
  if (!token) {
    return undefined
  }

  const multipleConfig = resolveSpreadsheetMultipleConfig(column.multiple)
  const normalizedToken = multipleConfig?.itemModifiers
    ? applySpreadsheetNormalization(token, multipleConfig.itemModifiers)
    : token

  const match = column.options.find((option) => {
    const candidate = String(option)
    if (!multipleConfig?.itemModifiers) {
      return candidate === token
    }

    return (
      applySpreadsheetNormalization(candidate, multipleConfig.itemModifiers) === normalizedToken
    )
  })
  if (match !== undefined) {
    return match
  }

  pushSpreadsheetParseIssue({
    code: 'enum.not_found',
    columnIndex: cell.columnIndex,
    columnKey: column.key,
    header: cell.header,
    issues,
    message: issueText.unrecognizedValue(token),
    rowIndex: cell.rowIndex,
  })
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
  const issueText = getSpreadsheetIssueText()
  if (!token) {
    return undefined
  }

  const options = resolveSpreadsheetColumnOptionEntries(column.options, context)
  const multipleConfig = resolveSpreadsheetMultipleConfig(column.multiple)
  const normalizedToken = multipleConfig?.itemModifiers
    ? applySpreadsheetNormalization(token, multipleConfig.itemModifiers)
    : token
  const match = options.find((option: SpreadsheetValue) => {
    const label = getSpreadsheetOptionLabel(option)
    const value = getSpreadsheetOptionValue(option)
    const by = multipleConfig?.matchBy

    if (by === 'label') {
      return (
        (multipleConfig?.itemModifiers
          ? applySpreadsheetNormalization(label, multipleConfig.itemModifiers)
          : label) === normalizedToken
      )
    }

    if (by === 'value') {
      return (
        (multipleConfig?.itemModifiers
          ? applySpreadsheetNormalization(String(value ?? ''), multipleConfig.itemModifiers)
          : String(value ?? '')) === normalizedToken
      )
    }

    return token === label || token === String(value ?? '')
  })

  if (match === undefined) {
    pushSpreadsheetParseIssue({
      code: 'option.not_found',
      columnIndex: cell.columnIndex,
      columnKey: column.key,
      header: cell.header,
      issues,
      message: issueText.unrecognizedValue(token),
      rowIndex: cell.rowIndex,
    })

    return
  }

  return getSpreadsheetOptionValue(match)
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
  const issueText = getSpreadsheetIssueText()
  if (column.kind === 'text' || column.kind === 'email' || column.kind === 'date') {
    return token
  }
  if (column.kind === 'number') {
    const value = parseSpreadsheetNumberValue(token)
    if (value !== undefined) {
      return value
    }

    pushSpreadsheetParseIssue({
      code: 'number.invalid',
      columnIndex: cell.columnIndex,
      columnKey: column.key,
      header: cell.header,
      issues,
      message: issueText.invalidNumberInput(token),
      rowIndex: cell.rowIndex,
    })
    return
  }
  if (column.kind === 'boolean') {
    const value = parseSpreadsheetBooleanValue(token)
    if (value !== undefined) {
      return value
    }

    pushSpreadsheetParseIssue({
      code: 'boolean.invalid',
      columnIndex: cell.columnIndex,
      columnKey: column.key,
      header: cell.header,
      issues,
      message: issueText.invalidBooleanInput(token),
      rowIndex: cell.rowIndex,
    })
    return
  }
  if (isSpreadsheetEnumColumn(column)) {
    return parseSpreadsheetEnumColumnValue(column, token, cell, issues)
  }
  if (isSpreadsheetOptionColumn(column)) {
    return parseSpreadsheetOptionColumnValue(column, token, cell, context, issues)
  }

  return token
}

function createSpreadsheetCellWithModifiers(
  cell: SpreadsheetCellValue,
  modifiers: readonly string[] | undefined,
): SpreadsheetCellValue {
  if (!modifiers?.length) {
    return cell
  }

  return {
    ...cell,
    text: applySpreadsheetModifiers(cell.text, modifiers),
  }
}

function parseSpreadsheetBuiltInCellValue<TContext>(
  column: SpreadsheetColumnDefinition<string, unknown, boolean, TContext>,
  cell: SpreadsheetCellValue,
  context: TContext,
  issues: SpreadsheetRowIssue[],
) {
  const nextCell = createSpreadsheetCellWithModifiers(cell, column.modifiers)
  const multipleConfig = resolveSpreadsheetMultipleConfig(column.multiple)
  if (!multipleConfig) {
    return parseSpreadsheetSingleBuiltInValue(column, nextCell.text, nextCell, context, issues)
  }

  if (!nextCell.text) {
    return []
  }

  return splitSpreadsheetMultipleTokens(nextCell.text, multipleConfig.separator).flatMap(
    (token) => {
      const nextToken = applySpreadsheetModifiers(token, multipleConfig.itemModifiers)
      const value = parseSpreadsheetSingleBuiltInValue(column, nextToken, nextCell, context, issues)
      return value === undefined ? [] : [value]
    },
  )
}

export async function parseSpreadsheetCellValue<TContext>(
  column: SpreadsheetColumnDefinition<string, unknown, boolean, TContext>,
  cell: SpreadsheetCellValue,
  context: TContext,
  issues: SpreadsheetRowIssue[],
) {
  const issueText = getSpreadsheetIssueText()
  const nextCell = createSpreadsheetCellWithModifiers(cell, column.modifiers)
  const isEmpty = nextCell.text.trim() === ''

  if (column.required && !hasSpreadsheetColumnResolve(column) && isEmpty) {
    issues.push({
      code: 'cell.required',
      columnIndex: cell.columnIndex,
      columnKey: column.key,
      header: cell.header,
      level: 'error',
      message: issueText.missingValue(cell.header),
      rowIndex: cell.rowIndex,
    })
  }

  try {
    const value = column.parse
      ? await column.parse({ cell: nextCell, context })
      : parseSpreadsheetBuiltInCellValue(column, cell, context, issues)

    const validationIssues = hasSpreadsheetColumnResolve(column)
      ? []
      : executeSpreadsheetRules({
          rules: column.rules,
          value,
        })

    issues.push(
      ...validationIssues.map(
        (issue: {
          ruleKey?: string
          level: 'error' | 'warning' | 'info'
          code: string
          message: string
        }) => ({
          ...issue,
          columnIndex: cell.columnIndex,
          columnKey: column.key,
          header: cell.header,
          rowIndex: cell.rowIndex,
        }),
      ),
    )

    if (isEmpty && !column.parse) {
      return undefined
    }
    return value
  } catch (error) {
    issues.push({
      code: 'cell.parse_failed',
      columnIndex: cell.columnIndex,
      columnKey: column.key,
      header: cell.header,
      level: 'error',
      message: error instanceof Error ? error.message : issueText.parseFailed(cell.header),
      rowIndex: cell.rowIndex,
    })
  }
}
