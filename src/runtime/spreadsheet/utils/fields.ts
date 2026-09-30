import type { UiToolsTranslator } from '#ui-tools/i18n'
import { resolveTextValue } from '#ui-tools/shared/utils/render'

import { createSpreadsheetColumnFactory } from '../schema/builder'
import type {
  SpreadsheetColumnEntry,
  SpreadsheetContextCallback,
  SpreadsheetDynamicEntry,
  SpreadsheetEntry,
  SpreadsheetField,
  SpreadsheetFieldGroup,
  SpreadsheetHeaderMatcher,
  SpreadsheetOptionItem,
  SpreadsheetOptionsConfig,
  SpreadsheetOptionsInput,
  SpreadsheetOptionsSource,
  SpreadsheetRecord,
} from '../types'
import {
  isSpreadsheetMatcherList,
  isSpreadsheetOptionList,
  isSpreadsheetOptionsResolver,
  isSpreadsheetRowCallback,
  isSpreadsheetRuleList,
} from './guards'
import { isSpreadsheetRecord } from './paths'
import { createSpreadsheetRuleBuilder } from './rules'

const DEFAULT_TRUE = ['yes', 'y', 'oui', 'o', 'true', 'vrai', 'x', '1']
const DEFAULT_FALSE = ['no', 'n', 'non', 'false', 'faux', '0']

/** `secureCode` → `Secure code`. */
export function humanizeSpreadsheetKey(key: string) {
  const words = key
    .replaceAll(/([a-z\d])([A-Z])/gu, '$1 $2')
    .replaceAll(/[_-]+/gu, ' ')
    .trim()
    .toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

function isOptionsConfig(
  input: SpreadsheetOptionsInput<unknown, SpreadsheetOptionItem, unknown>,
): input is SpreadsheetOptionsConfig<unknown, SpreadsheetOptionItem, unknown> {
  return (
    isSpreadsheetRecord(input) && 'source' in input && !('queryKey' in input) && !('load' in input)
  )
}

function toMatchers(
  value: SpreadsheetHeaderMatcher | readonly SpreadsheetHeaderMatcher[] | undefined,
) {
  if (value === undefined) return []
  return isSpreadsheetMatcherList(value) ? value : [value]
}

function resolveRules(column: SpreadsheetColumnEntry, t: UiToolsTranslator, ctx: unknown) {
  const rules = column.config.rules
  if (!rules) return { rulesOf: () => [], staticRules: true }
  if (isSpreadsheetRuleList(rules)) return { rulesOf: () => rules, staticRules: true }
  const builder = createSpreadsheetRuleBuilder(t)
  // A rules function declaring a second parameter reads the row: it runs for each row.
  if (rules.length >= 2)
    return { rulesOf: (row: SpreadsheetRecord) => rules(builder, { ctx, row }), staticRules: false }
  const resolved = rules(builder, { ctx, row: {} })
  return { rulesOf: () => resolved, staticRules: true }
}

/**
 * Paths of the row a function reads, found by running it on a recording row. Reading a missing
 * value returns a recording object too, so `row.levels.general` is seen whole; converting one to
 * text gives `''`.
 */
export function recordSpreadsheetRowReads(read: (row: SpreadsheetRecord) => unknown) {
  const paths = new Set<string>()
  function record(prefix: string): SpreadsheetRecord {
    return new Proxy<SpreadsheetRecord>(
      {},
      {
        get(_, property) {
          if (property === Symbol.toPrimitive) return () => ''
          if (typeof property !== 'string') return undefined
          const path = prefix ? `${prefix}.${property}` : property
          paths.add(path)
          return record(path)
        },
      },
    )
  }
  let result: unknown = undefined
  try {
    result = read(record(''))
  } catch {
    // Reading a recording row may throw; the paths read until then are enough.
  }
  return { paths, result }
}

/**
 * Options depending on the row: the source is a function reading `row`. They resolve to a list
 * for each row, and the fields they read are recorded to describe each set of options.
 */
function resolveRowOptions(params: {
  source: SpreadsheetOptionsSource<unknown, SpreadsheetOptionItem, unknown>
  ctx: unknown
  path: string
  fieldPaths: readonly string[]
}) {
  const source = params.source
  if (!isSpreadsheetOptionsResolver(source)) return null
  const { paths, result } = recordSpreadsheetRowReads((row) => source({ ctx: params.ctx, row }))
  if (!paths.size) return null
  if (result !== undefined && !isSpreadsheetOptionList(result))
    throw new Error(`[spreadsheet] "${params.path}" reads the row: its options must be a list.`)
  return {
    dependsOn: params.fieldPaths.filter((path) => paths.has(path)),
    resolve: (row: SpreadsheetRecord) => {
      const resolved = source({ ctx: params.ctx, row })
      return isSpreadsheetOptionList(resolved) ? resolved : []
    },
  }
}

function resolveColumn(params: {
  column: SpreadsheetColumnEntry
  parent: string
  group: SpreadsheetFieldGroup | null
  ctx: unknown
  t: UiToolsTranslator
  fieldPaths: readonly string[]
}): SpreadsheetField {
  const { column, ctx } = params
  const config = column.config
  const path = params.parent ? `${params.parent}.${column.key}` : column.key
  const label = resolveTextValue(config.label, humanizeSpreadsheetKey(column.key))
  const declared = toMatchers(config.headers)
  const headers: SpreadsheetHeaderMatcher[] = [label, column.key, ...declared]
  const name = declared.find((matcher) => typeof matcher === 'string')
  const fallback = config.default
  const defaultOf =
    fallback === undefined
      ? null
      : isSpreadsheetRowCallback(fallback)
        ? (row: SpreadsheetRecord) => fallback({ ctx, row })
        : () => fallback
  const multiple = config.multiple
  const separator = multiple === true ? ',' : multiple ? (multiple.separator ?? ',') : null

  let select: SpreadsheetField['select'] = null
  if (column.kind === 'select' && config.options) {
    const options = config.options
    const create = isOptionsConfig(options) ? (options.create ?? null) : null
    const unknown = config.unknown ?? 'ask'
    if (unknown === 'create' && !create)
      throw new Error(`[spreadsheet] "${path}" sets unknown: 'create' without options.create.`)
    const source = isOptionsConfig(options) ? options.source : options
    select = {
      create,
      from: config.from ?? null,
      rowOptions: resolveRowOptions({ ctx, fieldPaths: params.fieldPaths, path, source }),
      source,
      unknown,
    }
  }

  return {
    decimal: config.decimal ?? '.',
    defaultOf,
    description: resolveTextValue(config.description),
    editable: config.editable ?? true,
    example: resolveTextValue(config.example),
    falseTexts: config.false ?? DEFAULT_FALSE,
    formats: config.formats ?? [],
    group: params.group,
    hasDefault: fallback !== undefined,
    headers,
    kind: column.kind,
    label,
    name: typeof name === 'string' ? name : label,
    parse: config.parse ?? null,
    path,
    required: config.required ?? false,
    ...resolveRules(column, params.t, ctx),
    select,
    separator,
    trueTexts: config.true ?? DEFAULT_TRUE,
  }
}

function buildDynamicColumns(entry: SpreadsheetDynamicEntry, ctx: unknown) {
  const factory = createSpreadsheetColumnFactory()
  return entry.config.items({ ctx }).map((item) => entry.config.column(item, factory))
}

/**
 * Resolves the schema's columns for a context: groups are flattened into field paths, dynamic
 * groups get one column per item, columns and groups whose `when` returns `false` are left out,
 * and texts, rules, and options depending on the row are resolved.
 */
export function resolveSpreadsheetFields(params: {
  entries: readonly SpreadsheetEntry[]
  ctx: unknown
  t: UiToolsTranslator
}) {
  const fields: SpreadsheetField[] = []
  const groups: SpreadsheetFieldGroup[] = []
  const visible = (entry: { config: { when?: SpreadsheetContextCallback<unknown, boolean> } }) =>
    !entry.config.when || entry.config.when({ ctx: params.ctx })

  function add(
    column: SpreadsheetColumnEntry,
    parent: string,
    group: SpreadsheetFieldGroup | null,
  ) {
    if (!visible(column)) return
    fields.push(
      resolveColumn({
        column,
        ctx: params.ctx,
        fieldPaths: fields.map((field) => field.path),
        group,
        parent,
        t: params.t,
      }),
    )
  }

  for (const entry of params.entries) {
    if (entry.entry === 'column') {
      add(entry, '', null)
      continue
    }
    if (!visible(entry)) continue
    const group: SpreadsheetFieldGroup = {
      description: resolveTextValue(entry.config.description),
      dynamic: entry.entry === 'dynamic',
      label: resolveTextValue(entry.config.label, humanizeSpreadsheetKey(entry.key)),
      path: entry.key,
    }
    groups.push(group)
    const columns =
      entry.entry === 'group' ? entry.children : buildDynamicColumns(entry, params.ctx)
    for (const column of columns) add(column, entry.key, group)
  }

  for (const [index, field] of fields.entries()) {
    const from = field.select?.from
    if (from && !fields.slice(0, index).some((other) => other.path === from))
      throw new Error(
        `[spreadsheet] "${field.path}" reads from "${from}", which is not a column above.`,
      )
  }

  return { fields, groups }
}
