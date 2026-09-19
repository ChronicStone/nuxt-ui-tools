import type {
  SpreadsheetColumnDefinition,
  SpreadsheetDynamicCollectionDefinition,
  SpreadsheetDynamicOptionGroupsDefinition,
  SpreadsheetOptionItem,
  SpreadsheetDynamicOptionsValueDefinition,
  SpreadsheetDynamicValueDefinition,
  SpreadsheetCellValue,
  SpreadsheetColumnMatch,
  SpreadsheetDynamicColumnMatch,
  SpreadsheetParsedRow,
  SpreadsheetRowIssue,
  SpreadsheetRecord,
  SpreadsheetValue,
} from '../../types'
import { setSpreadsheetValueAtPath } from '../object'
import {
  getSpreadsheetOptionLabel,
  getSpreadsheetOptionValue,
  resolveSpreadsheetOptionEntries,
} from '../options'
import {
  applySpreadsheetModifiers,
  applySpreadsheetNormalization,
  getSpreadsheetIssueText,
  isSpreadsheetDynamicCollectionColumn,
  parseSpreadsheetCellValue,
} from './shared'

function resolveOptionValue<TOption extends SpreadsheetOptionItem>(params: {
  definition: SpreadsheetDynamicOptionsValueDefinition<TOption, 'single' | 'multiple'>
  raw: unknown
  issues: SpreadsheetRowIssue[]
  rowIndex: number
  columnIndex: number
  columnKey: string
  header: string
}) {
  const issueText = getSpreadsheetIssueText()
  const text = String(params.raw ?? '').trim()
  if (!text) {
    return params.definition.mode === 'multiple' ? [] : undefined
  }

  const tokens =
    params.definition.mode === 'multiple'
      ? text
          .split(params.definition.separator ?? ',')
          .map((entry) => entry.trim())
          .filter(Boolean)
      : [text]

  const resolvedValues: unknown[] = []

  for (const token of tokens) {
    const normalizedToken = applySpreadsheetNormalization(token, params.definition.itemModifiers)
    const match = params.definition.from.find((option: TOption) => {
      const candidate =
        params.definition.matchBy === 'value'
          ? String(getSpreadsheetOptionValue(option) ?? '')
          : getSpreadsheetOptionLabel(option)

      return (
        applySpreadsheetNormalization(candidate, params.definition.itemModifiers) ===
        normalizedToken
      )
    })

    if (!match) {
      params.issues.push({
        code: 'option.not_found',
        columnIndex: params.columnIndex,
        columnKey: params.columnKey,
        header: params.header,
        level: 'error',
        message: issueText.unrecognizedValue(token),
        rowIndex: params.rowIndex,
      })
      continue
    }

    const value = getSpreadsheetOptionValue(match)

    if (value === undefined) {
      continue
    }
    resolvedValues.push(value)
  }

  if (params.definition.mode === 'multiple') {
    return resolvedValues
  }
  return resolvedValues[0]
}

function resolveCollectionCellValue(params: {
  column: SpreadsheetDynamicCollectionDefinition<string, 'array' | 'record'>
  match: SpreadsheetDynamicColumnMatch
  raw: unknown
  issues: SpreadsheetRowIssue[]
  rowIndex: number
}) {
  const { item } = params.match
  if (!item) {
    return undefined
  }

  // SAFETY: collection items are normalized before parsing, so each item.value is a value definition here.
  const valueDefinition = item.value as SpreadsheetDynamicValueDefinition
  const text = String(params.raw ?? '').trim()
  if (!text) {
    return undefined
  }

  if (valueDefinition.kind === 'text') {
    return applySpreadsheetModifiers(text, valueDefinition.modifiers)
  }
  if (valueDefinition.kind === 'number') {
    return Number(text)
  }
  if (valueDefinition.kind === 'date') {
    return text
  }
  if (valueDefinition.kind === 'boolean') {
    return ['true', '1', 'yes'].includes(text.toLowerCase())
  }

  return resolveOptionValue({
    columnIndex: params.match.columnIndex,
    columnKey: item.id,
    definition: valueDefinition,
    header: params.match.header.text,
    issues: params.issues,
    raw: params.raw,
    rowIndex: params.rowIndex,
  })
}

function applyCollectionValue(params: {
  data: SpreadsheetRecord
  column: SpreadsheetDynamicCollectionDefinition<string, 'array' | 'record'>
  match: SpreadsheetDynamicColumnMatch
  resolvedValue: SpreadsheetValue
}) {
  const { item } = params.match
  if (!item) {
    return
  }
  if (params.resolvedValue === undefined) {
    return
  }

  const builtValue = item.build
    ? item.build(
        Array.isArray(params.resolvedValue)
          ? {
              id: item.id,
              source: params.match.source,
              values: params.resolvedValue,
            }
          : {
              id: item.id,
              source: params.match.source,
              value: params.resolvedValue,
            },
      )
    : params.resolvedValue

  if (params.column.as === 'array') {
    const existing = params.data[params.column.rootKey]
    const nextItems = Array.isArray(existing) ? existing : []
    const nextValue = item.build
      ? builtValue
      : Array.isArray(params.resolvedValue)
        ? { id: item.id, values: params.resolvedValue }
        : { id: item.id, value: params.resolvedValue }

    params.data[params.column.rootKey] = [...nextItems, nextValue]
    return
  }

  setSpreadsheetValueAtPath(params.data, `${params.column.rootKey}.${item.id}`, builtValue)
}

function resolveSpreadsheetDynamicCellValues(
  column: SpreadsheetDynamicOptionGroupsDefinition<string, string, unknown>,
  source: SpreadsheetValue,
  raw: SpreadsheetValue,
  issues: SpreadsheetRowIssue[],
  rowIndex: number,
  columnIndex: number,
  header: string,
) {
  const issueText = getSpreadsheetIssueText()
  const text = String(raw ?? '').trim()
  if (!text) {
    return []
  }

  const valuesConfig = column.values
  const optionsConfig = column.options
  if (!valuesConfig || !optionsConfig) {
    return []
  }

  const tokens =
    valuesConfig.mode === 'csv'
      ? text
          .split(valuesConfig.separator ?? ',')
          .map((entry) => entry.trim())
          .filter(Boolean)
      : [text]

  const options = resolveSpreadsheetOptionEntries(optionsConfig, source)
  const resolvedValues: SpreadsheetValue[] = []

  for (const token of tokens) {
    const normalizedToken = applySpreadsheetNormalization(token, valuesConfig.itemModifiers)
    const match = options.find((option: SpreadsheetValue) => {
      const candidate =
        valuesConfig.resolve === 'label'
          ? getSpreadsheetOptionLabel(option)
          : String(getSpreadsheetOptionValue(option) ?? '')

      return (
        applySpreadsheetNormalization(candidate, valuesConfig.itemModifiers) === normalizedToken
      )
    })

    if (!match) {
      issues.push({
        code: 'option.not_found',
        columnIndex,
        columnKey: column.key,
        header,
        level: 'error',
        message: issueText.unrecognizedValue(token),
        rowIndex,
      })
      continue
    }

    resolvedValues.push(getSpreadsheetOptionValue(match))
  }

  return resolvedValues
}

export async function parseSpreadsheetRows<TContext>(params: {
  rows: readonly (readonly unknown[])[]
  matches: readonly SpreadsheetColumnMatch<
    SpreadsheetColumnDefinition<string, unknown, boolean, TContext>
  >[]
  dynamicMatches?: readonly SpreadsheetDynamicColumnMatch[]
  context: TContext
}): Promise<SpreadsheetParsedRow<SpreadsheetRecord>[]> {
  const parsedRows: SpreadsheetParsedRow<SpreadsheetRecord>[] = []

  for (const [rowIndex, source] of params.rows.entries()) {
    const issues: SpreadsheetRowIssue[] = []
    const data: SpreadsheetRecord = {}

    for (const match of params.matches) {
      const raw = source[match.columnIndex]
      const cell: SpreadsheetCellValue = {
        columnIndex: match.columnIndex,
        header: match.header.text,
        raw,
        rowIndex,
        text: String(raw ?? '').trim(),
      }

      const value = await parseSpreadsheetCellValue(match.column, cell, params.context, issues)

      if (value !== undefined) {
        setSpreadsheetValueAtPath(data, match.key, value)
      }
    }

    for (const entry of params.dynamicMatches ?? []) {
      const raw = source[entry.columnIndex]

      if (entry.column.kind === 'option-groups') {
        const values = resolveSpreadsheetDynamicCellValues(
          entry.column,
          entry.source,
          raw,
          issues,
          rowIndex,
          entry.columnIndex,
          entry.header.text,
        )

        if (values.length) {
          setSpreadsheetValueAtPath(data, `${entry.key}.${entry.targetKey}`, values)
        }

        continue
      }

      if (!isSpreadsheetDynamicCollectionColumn(entry.column)) {
        continue
      }

      const resolvedValue = resolveCollectionCellValue({
        column: entry.column,
        issues,
        match: entry,
        raw,
        rowIndex,
      })

      applyCollectionValue({
        column: entry.column,
        data,
        match: entry,
        resolvedValue,
      })
    }

    parsedRows.push({
      data,
      index: rowIndex,
      isValid: issues.every((issue) => issue.level !== 'error'),
      issues,
      source,
    })
  }

  return parsedRows
}
