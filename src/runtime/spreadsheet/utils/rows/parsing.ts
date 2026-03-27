import type {
  SpreadsheetColumnDefinition,
  SpreadsheetDynamicCollectionDefinition,
  SpreadsheetDynamicOptionGroupsDefinition,
  SpreadsheetDynamicOptionsValueDefinition,
  SpreadsheetDynamicValueDefinition,
} from '../../types'
import type {
  SpreadsheetCellValue,
  SpreadsheetColumnMatch,
  SpreadsheetDynamicColumnMatch,
  SpreadsheetParsedRow,
  SpreadsheetRowIssue,
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
  isSpreadsheetDynamicCollectionColumn,
  parseSpreadsheetCellValue,
} from './shared'

function resolveOptionValue<TOption extends string | number | boolean | { label: string, value: unknown }>(params: {
  definition: SpreadsheetDynamicOptionsValueDefinition<TOption, 'single' | 'multiple'>
  raw: unknown
  issues: SpreadsheetRowIssue[]
  rowIndex: number
  columnIndex: number
  columnKey: string
  header: string
}) {
  const text = String(params.raw ?? '').trim()
  if (!text) return params.definition.mode === 'multiple' ? [] : undefined

  const tokens = params.definition.mode === 'multiple'
    ? text.split(params.definition.separator ?? ',').map((entry) => entry.trim()).filter(Boolean)
    : [text]

  const resolvedValues: unknown[] = []

  for (const token of tokens) {
    const normalizedToken = applySpreadsheetNormalization(token, params.definition.itemModifiers)
    const match = params.definition.from.find((option: TOption) => {
      const candidate = params.definition.matchBy === 'value'
        ? String(getSpreadsheetOptionValue(option) ?? '')
        : getSpreadsheetOptionLabel(option)

      return applySpreadsheetNormalization(candidate, params.definition.itemModifiers) === normalizedToken
    })

    if (!match) {
      params.issues.push({
        level: 'error',
        code: 'option.not_found',
        message: `Unknown option "${token}"`,
        rowIndex: params.rowIndex,
        columnKey: params.columnKey,
        columnIndex: params.columnIndex,
        header: params.header,
      })
      continue
    }

    const value = getSpreadsheetOptionValue(match)

    if (value === undefined) continue
    resolvedValues.push(value)
  }

  if (params.definition.mode === 'multiple') return resolvedValues
  return resolvedValues[0]
}

function resolveCollectionCellValue(params: {
  column: SpreadsheetDynamicCollectionDefinition<string, 'array' | 'record'>
  match: SpreadsheetDynamicColumnMatch
  raw: unknown
  issues: SpreadsheetRowIssue[]
  rowIndex: number
}) {
  const item = params.match.item
  if (!item) return undefined

  const valueDefinition = item.value as SpreadsheetDynamicValueDefinition
  const text = String(params.raw ?? '').trim()
  if (!text) return undefined

  if (valueDefinition.kind === 'text')
    return applySpreadsheetModifiers(text, valueDefinition.modifiers)
  if (valueDefinition.kind === 'number') return Number(text)
  if (valueDefinition.kind === 'date') return text
  if (valueDefinition.kind === 'boolean') return ['true', '1', 'yes'].includes(text.toLowerCase())

  return resolveOptionValue({
    definition: valueDefinition,
    raw: params.raw,
    issues: params.issues,
    rowIndex: params.rowIndex,
    columnIndex: params.match.columnIndex,
    columnKey: item.id,
    header: params.match.header.text,
  })
}

function applyCollectionValue(params: {
  data: Record<string, unknown>
  column: SpreadsheetDynamicCollectionDefinition<string, 'array' | 'record'>
  match: SpreadsheetDynamicColumnMatch
  resolvedValue: unknown
}) {
  const item = params.match.item
  if (!item) return
  if (params.resolvedValue === undefined) return

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
  source: unknown,
  raw: unknown,
  issues: SpreadsheetRowIssue[],
  rowIndex: number,
  columnIndex: number,
  header: string,
) {
  const text = String(raw ?? '').trim()
  if (!text) return []

  const valuesConfig = column.values
  const optionsConfig = column.options
  if (!valuesConfig || !optionsConfig) return []

  const tokens = valuesConfig.mode === 'csv'
    ? text.split(valuesConfig.separator ?? ',').map((entry) => entry.trim()).filter(Boolean)
    : [text]

  const options = resolveSpreadsheetOptionEntries(optionsConfig, source)
  const resolvedValues: unknown[] = []

  for (const token of tokens) {
    const normalizedToken = applySpreadsheetNormalization(token, valuesConfig.itemModifiers)
    const match = options.find((option: unknown) => {
      const candidate = valuesConfig.resolve === 'label'
        ? getSpreadsheetOptionLabel(option)
        : String(getSpreadsheetOptionValue(option) ?? '')

      return applySpreadsheetNormalization(candidate, valuesConfig.itemModifiers) === normalizedToken
    })

    if (!match) {
      issues.push({
        level: 'error',
        code: 'option.not_found',
        message: `Unknown option "${token}"`,
        rowIndex,
        columnKey: column.key,
        columnIndex,
        header,
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
}): Promise<SpreadsheetParsedRow<Record<string, unknown>>[]> {
  const parsedRows: SpreadsheetParsedRow<Record<string, unknown>>[] = []

  for (const [rowIndex, source] of params.rows.entries()) {
    const issues: SpreadsheetRowIssue[] = []
    const data: Record<string, unknown> = {}

    for (const match of params.matches) {
      const raw = source[match.columnIndex]
      const cell: SpreadsheetCellValue = {
        text: String(raw ?? '').trim(),
        raw,
        header: match.header.text,
        columnIndex: match.columnIndex,
        rowIndex,
      }

      const value = await parseSpreadsheetCellValue(
        match.column,
        cell,
        params.context,
        issues,
      )

      if (value !== undefined)
        setSpreadsheetValueAtPath(data, match.key, value)
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

        if (values.length)
          setSpreadsheetValueAtPath(data, `${entry.key}.${entry.targetKey}`, values)

        continue
      }

      if (!isSpreadsheetDynamicCollectionColumn(entry.column)) continue

      const resolvedValue = resolveCollectionCellValue({
        column: entry.column,
        match: entry,
        raw,
        issues,
        rowIndex,
      })

      applyCollectionValue({
        data,
        column: entry.column,
        match: entry,
        resolvedValue,
      })
    }

    parsedRows.push({
      index: rowIndex,
      source,
      data,
      issues,
      isValid: issues.every((issue) => issue.level !== 'error'),
    })
  }

  return parsedRows
}
