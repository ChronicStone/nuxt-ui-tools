import { useQueryClient } from '@tanstack/vue-query'
import { computed, shallowRef, watch } from 'vue'
import type { ComputedRef } from 'vue'

import type { UiToolsTranslator } from '#ui-tools/i18n'

import type {
  SpreadsheetCellView,
  SpreadsheetDiscardReason,
  SpreadsheetIssueLevel,
  SpreadsheetRecord,
  SpreadsheetRow,
  SpreadsheetRowIssue,
  SpreadsheetRowMode,
  SpreadsheetRuntimeSchema,
} from '../types'
import {
  createSpreadsheetIssuesWorkbook,
  detectSpreadsheetKeyFields,
  diffSpreadsheetRow,
  getSpreadsheetPathValue,
  isSpreadsheetQueryDefinition,
  isSpreadsheetRecord,
  parseSpreadsheetRow,
  resolveSpreadsheetExistingAction,
  serializeSpreadsheetRowKey,
  toSpreadsheetText,
} from '../utils'
import type { SpreadsheetParseContext, SpreadsheetParsedRow } from '../utils'
import type { useSpreadsheetAnswers } from './use-spreadsheet-answers'
import type { useSpreadsheetColumns } from './use-spreadsheet-columns'
import type { useSpreadsheetContext } from './use-spreadsheet-context'
import type { useSpreadsheetEdits } from './use-spreadsheet-edits'
import type { useSpreadsheetFields } from './use-spreadsheet-fields'
import type { useSpreadsheetLayout } from './use-spreadsheet-layout'
import type { useSpreadsheetOptions } from './use-spreadsheet-options'
import { useSpreadsheetQueries } from './use-spreadsheet-queries'

export interface UseSpreadsheetRowsParams {
  schema: ComputedRef<SpreadsheetRuntimeSchema>
  context: ReturnType<typeof useSpreadsheetContext>
  fields: ReturnType<typeof useSpreadsheetFields>
  layout: ReturnType<typeof useSpreadsheetLayout>
  columns: ReturnType<typeof useSpreadsheetColumns>
  options: ReturnType<typeof useSpreadsheetOptions>
  answers: ReturnType<typeof useSpreadsheetAnswers>
  edits: ReturnType<typeof useSpreadsheetEdits>
  t: UiToolsTranslator
}

const LEVEL_RANK: Record<SpreadsheetIssueLevel, number> = { error: 3, info: 1, warning: 2 }

function mostSevere(issues: readonly SpreadsheetRowIssue[]) {
  const byField: Record<string, SpreadsheetRowIssue> = {}
  for (const issue of issues) {
    if (!issue.field || issue.code === 'value.skipped') continue
    const current = byField[issue.field]
    if (!current || LEVEL_RANK[issue.level] > LEVEL_RANK[current.level])
      byField[issue.field] = issue
  }
  return byField
}

function isRecordList(value: unknown): value is readonly unknown[] {
  return Array.isArray(value)
}

/**
 * Every data row of the file: parsed, validated, identified against the file and stored records,
 * and discarded or not. Parsing is cached per row; an edit re-parses its row only.
 */
export function useSpreadsheetRows(params: UseSpreadsheetRowsParams) {
  const queryClient = useQueryClient()
  const manualDiscards = shallowRef<ReadonlySet<number>>(new Set())
  const rejections = shallowRef<ReadonlyMap<number, readonly SpreadsheetRowIssue[]>>(new Map())

  watch([params.layout.sheet, () => params.layout.selection.value.headerRow], () => {
    manualDiscards.value = new Set()
    rejections.value = new Map()
  })

  const parseContext = computed<SpreadsheetParseContext>(() => {
    // Rows parse again once options load.
    void params.options.options.value
    return {
      answers: params.answers.answers.value,
      columns: params.columns.matches.value,
      ctx: params.context.ctx.value,
      fields: params.fields.fields.value,
      headers: params.layout.headers.value.map((header) => header.text),
      optionsOf: params.options.optionsOf,
      t: params.t,
    }
  })

  let cacheContext: SpreadsheetParseContext | null = null
  const cache = new Map<
    number,
    { cells: readonly string[]; edits: object | undefined; result: SpreadsheetParsedRow }
  >()

  const parsed = computed(() => {
    const context = parseContext.value
    if (cacheContext !== context) {
      cache.clear()
      cacheContext = context
    }
    const raws = params.layout.dataRaws.value
    return params.layout.dataRows.value.map((cells, index) => {
      const edits = params.edits.edits.value.get(index)
      const cached = cache.get(index)
      if (cached && cached.cells === cells && cached.edits === edits) return cached.result
      const result = parseSpreadsheetRow({ cells, context, edits, index, raws: raws[index] })
      cache.set(index, { cells, edits, result })
      return result
    })
  })

  const validationCache = new WeakMap<SpreadsheetParsedRow, readonly SpreadsheetRowIssue[]>()
  const validated = computed(() => {
    const validate = params.schema.value.validate
    const ctx = params.context.ctx.value
    return parsed.value.map((row) => {
      if (!validate) return row.issues
      const cached = validationCache.get(row)
      if (cached) return cached
      const extra = validate({
        ctx,
        issue: (field, message, options) => ({
          code: options?.code ?? 'validate',
          field,
          level: options?.level ?? 'error',
          message,
        }),
        row: row.data,
      }).flatMap((entry) => (entry ? [{ ...entry, field: entry.field }] : []))
      const withExtra = extra.length ? [...row.issues, ...extra] : row.issues
      validationCache.set(row, withExtra)
      return withExtra
    })
  })

  /* ---------------------------------------------------------------- identity */

  const keyOf = computed(() => params.schema.value.rows?.key)
  const keys = computed(() => {
    const key = keyOf.value
    if (!key) return parsed.value.map(() => null)
    return parsed.value.map((row) => {
      try {
        const value = key(row.data)
        const serialized = serializeSpreadsheetRowKey(value)
        return serialized === null ? null : { serialized, value }
      } catch {
        return null
      }
    })
  })
  const keyFields = computed(() => {
    const key = keyOf.value
    const sample = parsed.value.find((row) => Object.keys(row.data).length)?.data
    return key && sample ? detectSpreadsheetKeyFields(key, sample) : []
  })

  const duplicates = computed(() => {
    const groups = new Map<string, number[]>()
    for (const [index, key] of keys.value.entries()) {
      if (!key) continue
      const group = groups.get(key.serialized)
      if (group) group.push(index)
      else groups.set(key.serialized, [index])
    }
    const policy = params.schema.value.rows?.duplicates ?? 'error'
    const blocked = new Map<number, number>()
    const discarded = new Set<number>()
    for (const group of groups.values()) {
      if (group.length < 2) continue
      if (policy === 'error')
        for (const index of group)
          blocked.set(index, group.find((other) => other !== index) ?? index)
      else {
        const kept = policy === 'keep-first' ? group[0] : group.at(-1)
        for (const index of group) if (index !== kept) discarded.add(index)
      }
    }
    return { blocked, discarded }
  })

  const lookupKeys = computed(() => {
    const seen = new Map<string, unknown>()
    for (const key of keys.value)
      if (key && !seen.has(key.serialized)) seen.set(key.serialized, key.value)
    return seen
  })
  const existingQuery = computed(() => {
    const existing = params.schema.value.rows?.existing
    if (!existing || !lookupKeys.value.size || !params.context.ready.value) return []
    const values = [...lookupKeys.value.values()]
    const ctx = params.context.ctx.value
    return [
      {
        queryFn: async () => {
          const result = existing.lookup({ ctx, keys: values })
          return isSpreadsheetQueryDefinition<unknown>(result)
            ? queryClient.fetchQuery(result)
            : await result
        },
        queryKey: ['spreadsheet', params.schema.value.key, 'existing', ...lookupKeys.value.keys()],
      },
    ]
  })
  const existingResults = useSpreadsheetQueries(() => existingQuery.value)
  const existingLoading = computed(() => existingResults.value.some((result) => result.pending))
  const existingByKey = computed(() => {
    const map = new Map<string, unknown>()
    const records = existingResults.value[0]?.data
    const definition = params.schema.value.rows?.existing
    const key = keyOf.value
    if (!isRecordList(records) || !definition || !key) return map
    for (const record of records) {
      try {
        const value = definition.keyOf
          ? definition.keyOf(record)
          : isSpreadsheetRecord(record)
            ? key(record)
            : null
        const serialized = serializeSpreadsheetRowKey(value)
        if (serialized !== null) map.set(serialized, record)
      } catch {
        // A record without the key fields matches no row.
      }
    }
    return map
  })

  /* ---------------------------------------------------------------- rows */

  const maxRows = computed(() => params.schema.value.file?.maxRows ?? Infinity)
  const fieldPaths = computed(() => params.fields.fields.value.map((field) => field.path))

  const rows = computed(() => {
    const t = params.t
    const numbers = params.layout.dataRowNumbers.value
    const definition = params.schema.value.rows?.existing
    const ctx = params.context.ctx.value
    return parsed.value.map<SpreadsheetRow<SpreadsheetRecord, unknown>>((row, index) => {
      const rowIssues: SpreadsheetRowIssue[] = [...(validated.value[index] ?? row.issues)]
      const key = keys.value[index]
      const duplicateOf = duplicates.value.blocked.get(index)
      if (duplicateOf !== undefined) {
        const message = t('spreadsheet.issues.duplicate', {
          row: numbers[duplicateOf] ?? duplicateOf + 1,
        })
        const targets = keyFields.value.length ? keyFields.value : [null]
        for (const field of targets)
          rowIssues.push({ code: 'row.duplicate', field, level: 'error', message })
      }
      const existing = key ? existingByKey.value.get(key.serialized) : undefined
      let mode: SpreadsheetRowMode = 'create'
      let changed: readonly string[] = []
      if (existing !== undefined && definition) {
        const action = resolveSpreadsheetExistingAction({
          action: definition.action,
          ctx,
          existing,
          row: row.data,
        })
        mode = action === 'skip' ? 'skip' : 'update'
        if (action === 'error')
          rowIssues.push({
            code: 'row.exists',
            field: keyFields.value[0] ?? null,
            level: 'error',
            message: t('spreadsheet.issues.exists'),
          })
        else changed = diffSpreadsheetRow({ data: row.data, existing, paths: fieldPaths.value })
      }
      rowIssues.push(...(rejections.value.get(index) ?? []))

      const discardReason: SpreadsheetDiscardReason | null =
        index >= maxRows.value
          ? 'limit'
          : row.skipped
            ? 'value'
            : duplicates.value.discarded.has(index)
              ? 'duplicate'
              : mode === 'skip'
                ? 'existing'
                : manualDiscards.value.has(index)
                  ? 'manual'
                  : null
      const errors = rowIssues.filter((issue) => issue.level === 'error')
      const warnings = rowIssues.filter((issue) => issue.level === 'warning')
      return {
        changed,
        data: row.data,
        discardReason,
        edited: Object.keys(params.edits.edits.value.get(index) ?? {}),
        errors,
        existing,
        fieldIssues: mostSevere(rowIssues),
        importable: !discardReason && !errors.length,
        index,
        issues: rowIssues,
        mode,
        rowNumber: numbers[index] ?? index + 1,
        status: discardReason
          ? 'discarded'
          : errors.length
            ? 'blocking'
            : warnings.length
              ? 'warning'
              : 'valid',
        warnings,
      }
    })
  })

  const valid = computed(() => rows.value.filter((row) => !row.discardReason && !row.errors.length))
  const invalid = computed(() =>
    rows.value.filter((row) => !row.discardReason && row.errors.length > 0),
  )
  const discarded = computed(() => rows.value.filter((row) => row.discardReason))
  const importable = computed(() => rows.value.filter((row) => row.importable))
  const byMode = computed(() => ({
    create: importable.value.filter((row) => row.mode === 'create').length,
    skip: rows.value.filter((row) => row.discardReason === 'existing').length,
    update: importable.value.filter((row) => row.mode === 'update').length,
  }))

  function cell(index: number, field: string): SpreadsheetCellView {
    const row = rows.value[index]
    const result = parsed.value[index]?.cells.get(field)
    const edits = params.edits.edits.value.get(index)
    const stored = row?.changed.includes(field)
      ? toSpreadsheetText(
          getSpreadsheetPathValue(isSpreadsheetRecord(row.existing) ? row.existing : {}, field),
        )
      : null
    return {
      choices: result?.choices ?? [],
      created: result?.created ?? false,
      defaulted: result?.defaulted ?? false,
      display: result?.display ?? '',
      edited: Boolean(edits && field in edits),
      issue: row?.fieldIssues[field] ?? null,
      original: result?.original ?? '',
      stored,
      text: result?.text ?? '',
    }
  }

  function distinct(field: string) {
    const values = new Set<string>()
    for (const row of rows.value) {
      if (row.discardReason) continue
      const display = parsed.value[row.index]?.cells.get(field)?.display
      if (display) values.add(display)
    }
    return [...values]
  }

  function issues(field?: string) {
    return rows.value.flatMap((row) =>
      row.discardReason
        ? []
        : row.issues
            .filter((issue) => (field ? issue.field === field : true))
            .map((issue) => ({ issue, row: row.index })),
    )
  }

  function edit(index: number, field: string, text: string) {
    params.edits.set(index, field, text)
    if (rejections.value.has(index)) {
      const next = new Map(rejections.value)
      next.delete(index)
      rejections.value = next
    }
  }

  function discard(indexes: readonly number[]) {
    manualDiscards.value = new Set([...manualDiscards.value, ...indexes])
  }

  function restore(indexes: readonly number[]) {
    const next = new Set(manualDiscards.value)
    for (const index of indexes) next.delete(index)
    manualDiscards.value = next
  }

  function setRejections(next: ReadonlyMap<number, readonly SpreadsheetRowIssue[]>) {
    rejections.value = next
  }

  function exportInvalid(issuesHeader: string) {
    const labels = new Map(params.fields.fields.value.map((field) => [field.path, field.label]))
    const matches = params.columns.matches.value
    return createSpreadsheetIssuesWorkbook({
      headers: params.layout.headers.value.map((header) => header.text),
      issuesHeader,
      labels,
      rows: invalid.value.map((row) => {
        const cells = [...(params.layout.dataRows.value[row.index] ?? [])]
        for (const [field, text] of Object.entries(params.edits.edits.value.get(row.index) ?? {})) {
          const column = matches.get(field)
          if (column !== undefined) cells[column] = text
        }
        return { cells, issues: row.issues }
      }),
    })
  }

  function reset() {
    manualDiscards.value = new Set()
    rejections.value = new Map()
  }

  const loading = computed(() => existingLoading.value)

  return {
    byMode,
    cell,
    discard,
    discarded,
    distinct,
    edit,
    exportInvalid,
    importable,
    invalid,
    issues,
    keyFields,
    loading,
    parsed,
    rejections,
    reset,
    restore,
    rows,
    setRejections,
    valid,
  }
}
