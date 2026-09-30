import type { UiToolsTranslator } from '#ui-tools/i18n'

import type {
  SpreadsheetField,
  SpreadsheetFieldOptions,
  SpreadsheetRecord,
  SpreadsheetResolvedOption,
  SpreadsheetRowIssue,
  SpreadsheetRule,
  SpreadsheetValue,
  SpreadsheetValueAnswers,
} from '../types'
import { spreadsheetAnswerKey } from './options'
import { parseSpreadsheetBoolean, parseSpreadsheetDate, parseSpreadsheetNumber } from './parse'
import { setSpreadsheetPathValue } from './paths'
import { normalizeSpreadsheetText, splitSpreadsheetItems, toSpreadsheetText } from './text'

/** Options a select field checks a row against, and their scope when they depend on the row. */
export interface SpreadsheetRowOptions {
  options: SpreadsheetFieldOptions | undefined
  /** Id of the set of options, when they depend on the row; `null` otherwise. */
  scope: string | null
}

/** What parsing needs besides the row: fields, their columns, options, answers, and the context. */
export interface SpreadsheetParseContext {
  /** In declared order: a field reads the fields above it. */
  fields: readonly SpreadsheetField[]
  /** Column index of each field reading its own column. */
  columns: ReadonlyMap<string, number>
  headers: readonly string[]
  /** Options of a select field for a row, the fields above it parsed. */
  optionsOf: (field: SpreadsheetField, row: SpreadsheetRecord) => SpreadsheetRowOptions
  answers: SpreadsheetValueAnswers
  ctx: unknown
  t: UiToolsTranslator
}

/** A select item that matched no option, recorded to build the questions. */
export interface SpreadsheetUnmatchedToken {
  field: string
  /** Normalized value. */
  key: string
  value: string
  header: string
  scope: string | null
}

export interface SpreadsheetMatchedToken {
  field: string
  key: string
  value: string
  option: SpreadsheetResolvedOption
  scope: string | null
}

export interface SpreadsheetCellResult {
  text: string
  original: string
  display: string
  defaulted: boolean
  created: boolean
  /** Options of a select cell, for this row. */
  choices: readonly SpreadsheetResolvedOption[]
}

export interface SpreadsheetParsedRow {
  data: SpreadsheetRecord
  issues: SpreadsheetRowIssue[]
  cells: Map<string, SpreadsheetCellResult>
  unmatched: SpreadsheetUnmatchedToken[]
  matched: SpreadsheetMatchedToken[]
  /** A value answered “skip these rows”, by the user or the policy. */
  skipped: boolean
}

function displayValue(
  field: SpreadsheetField,
  value: unknown,
  options: SpreadsheetFieldOptions | undefined,
) {
  const items = Array.isArray(value) ? value : [value]
  return items
    .filter((item) => item !== null && item !== undefined)
    .map((item) => {
      if (field.kind !== 'select') return toSpreadsheetText(item)
      return (
        options?.options.find((option) => option.value === item)?.label ?? toSpreadsheetText(item)
      )
    })
    .join(', ')
}

function parseScalar(params: {
  field: SpreadsheetField
  text: string
  raw: unknown
  ctx: unknown
  row: SpreadsheetRecord
  rowIndex: number
  header: string
}): { value: unknown } | { error: string } {
  const { field, text, raw } = params
  if (field.parse) {
    try {
      return {
        value: field.parse({
          cell: { header: params.header, raw: raw ?? text, rowIndex: params.rowIndex, text },
          ctx: params.ctx,
          row: params.row,
        }),
      }
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) }
    }
  }
  if (field.kind === 'number') {
    const value = parseSpreadsheetNumber(text, raw, field.decimal)
    return value === null ? { error: 'number' } : { value }
  }
  if (field.kind === 'date') {
    const value = parseSpreadsheetDate(text, raw, field.formats)
    return value === null ? { error: 'date' } : { value }
  }
  if (field.kind === 'boolean') {
    const value = parseSpreadsheetBoolean(text, raw, field.trueTexts, field.falseTexts)
    return value === null ? { error: 'boolean' } : { value }
  }
  return { value: text }
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

/**
 * Parses one data row, field by field in declared order: each field reads its cell (or the cell
 * of its `from` column), applies its default, parser, options, and value answers, then its rules.
 * Defaults, parsers, options, and rules receive the fields above as `row`. Nothing is guessed: a
 * select value matches an option exactly, or it is answered, or it follows the column's `unknown`
 * policy.
 */
export function parseSpreadsheetRow(params: {
  index: number
  cells: readonly string[]
  raws: readonly unknown[] | undefined
  edits: Readonly<Record<string, string>> | undefined
  context: SpreadsheetParseContext
}): SpreadsheetParsedRow {
  const { context, edits } = params
  const { t } = context
  const data: SpreadsheetRecord = {}
  const issues: SpreadsheetRowIssue[] = []
  const cells = new Map<string, SpreadsheetCellResult>()
  const unmatched: SpreadsheetUnmatchedToken[] = []
  const matched: SpreadsheetMatchedToken[] = []
  let skipped = false

  for (const field of context.fields) {
    const from = field.select?.from ?? null
    const column = from ? context.columns.get(from) : context.columns.get(field.path)
    const header = column === undefined ? '' : (context.headers[column] ?? '')
    const original = from
      ? (cells.get(from)?.text ?? '')
      : column === undefined
        ? ''
        : toSpreadsheetText(params.cells[column])
    const edited = edits?.[field.path]
    const text = edited ?? original
    const raw =
      edited === undefined && !from && column !== undefined ? params.raws?.[column] : undefined
    const issue = (code: string, message: string, level: SpreadsheetRowIssue['level'] = 'error') =>
      issues.push({ code, field: field.path, level, message })

    let resolved: SpreadsheetRowOptions = { options: undefined, scope: null }
    if (field.select) {
      try {
        resolved = context.optionsOf(field, data)
      } catch (error) {
        issue('options', errorMessage(error))
      }
    }
    const { options, scope } = resolved
    const choices = options?.options ?? []

    if (!text) {
      let value: unknown = field.separator ? [] : null
      if (field.defaultOf) {
        try {
          value = field.defaultOf(data) ?? value
        } catch (error) {
          issue('default', errorMessage(error))
        }
      }
      setSpreadsheetPathValue(data, field.path, value)
      cells.set(field.path, {
        choices,
        created: false,
        defaulted: field.hasDefault,
        display: field.hasDefault ? displayValue(field, value, options) : '',
        original,
        text,
      })
      if (field.required && !field.hasDefault) issue('required', t('spreadsheet.issues.required'))
      continue
    }

    const items = field.separator ? splitSpreadsheetItems(text, field.separator) : [text]
    const values: unknown[] = []
    let created = false

    if (field.kind === 'select' && field.select) {
      for (const item of items) {
        const key = normalizeSpreadsheetText(item)
        const option = options?.index.get(key)
        if (option) {
          values.push(option.value)
          matched.push({ field: field.path, key, option, scope, value: item })
          continue
        }
        if (!options || options.status !== 'ready') continue
        unmatched.push({ field: field.path, header, key, scope, value: item })
        const answer =
          context.answers[field.path]?.[spreadsheetAnswerKey(key, scope)] ??
          (field.select.unknown === 'ask' || field.select.unknown === 'error'
            ? undefined
            : { action: field.select.unknown })
        if (answer?.action === 'map') values.push(answer.value)
        else if (answer?.action === 'create') {
          values.push(item)
          created = true
        } else if (answer?.action === 'skip-rows') {
          skipped = true
          issue('value.skipped', t('spreadsheet.issues.skipped', { value: item }), 'info')
        } else if (answer?.action === 'leave-empty') continue
        else if (field.select.unknown === 'error')
          issue('value.not-found', t('spreadsheet.issues.notFound', { value: item }))
        else issue('value.unknown', t('spreadsheet.issues.unknownValue', { value: item }))
      }
    } else {
      for (const item of items) {
        const result = parseScalar({
          ctx: context.ctx,
          field,
          header,
          raw: items.length > 1 ? undefined : raw,
          row: data,
          rowIndex: params.index,
          text: item,
        })
        if ('value' in result) values.push(result.value)
        else if (result.error === 'number' || result.error === 'date' || result.error === 'boolean')
          issue(result.error, t(`spreadsheet.issues.${result.error}`, { value: item }))
        else issue('parse', result.error)
      }
    }

    const value: SpreadsheetValue = field.separator ? values : (values[0] ?? null)
    setSpreadsheetPathValue(data, field.path, value)
    cells.set(field.path, {
      choices,
      created,
      defaulted: false,
      display: displayValue(field, value, options) || text,
      original,
      text,
    })

    if (
      field.required &&
      (value === null || (Array.isArray(value) && !value.length)) &&
      !issues.some((entry) => entry.field === field.path)
    )
      issue('required', t('spreadsheet.issues.required'))

    let rules: readonly SpreadsheetRule<unknown>[] = []
    try {
      rules = field.rulesOf(data)
    } catch (error) {
      issue('rules', errorMessage(error))
    }
    for (const rule of rules) {
      const targets = field.separator ? values : [value]
      for (const target of targets) {
        if (target === null && !rule.required) continue
        const message = rule.check(target, { ctx: context.ctx })
        if (message) {
          issue(rule.name, message, rule.level)
          break
        }
      }
    }
  }

  return { cells, data, issues, matched, skipped, unmatched }
}
