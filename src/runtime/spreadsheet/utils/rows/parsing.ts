import type {
  SpreadsheetColumnDefinition,
  SpreadsheetDynamicOptionGroupsDefinition,
} from '../../types'
import type {
  SpreadsheetCellValue,
  SpreadsheetColumnMatch,
  SpreadsheetDynamicColumnMatch,
  SpreadsheetParsedRow,
  SpreadsheetRowIssue,
} from '../../types'
import { setSpreadsheetValueAtPath } from '../object'
import { applySpreadsheetNormalization, parseSpreadsheetCellValue } from './shared'

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

  const options = optionsConfig.resolve(source)
  const resolvedValues: unknown[] = []

  for (const token of tokens) {
    const normalizedToken = applySpreadsheetNormalization(token, valuesConfig.normalize)
    const match = options.find((option) => {
      const candidate = valuesConfig.resolve === 'label'
        ? optionsConfig.optionLabel(option)
        : String(optionsConfig.optionValue(option))

      return applySpreadsheetNormalization(candidate, valuesConfig.normalize) === normalizedToken
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

    resolvedValues.push(optionsConfig.optionValue(match))
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

    for (const match of params.dynamicMatches ?? []) {
      const raw = source[match.columnIndex]
      const values = resolveSpreadsheetDynamicCellValues(
        match.column,
        match.source,
        raw,
        issues,
        rowIndex,
        match.columnIndex,
        match.header.text,
      )

      if (values.length)
        setSpreadsheetValueAtPath(data, `${match.column.output.into}.${match.targetKey}`, values)
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
