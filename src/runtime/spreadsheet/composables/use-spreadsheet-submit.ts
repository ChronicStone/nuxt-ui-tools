import { shallowRef } from 'vue'
import type { ComputedRef } from 'vue'

import type { UiToolsTranslator } from '#ui-tools/i18n'

import type {
  SpreadsheetRecord,
  SpreadsheetRowIssue,
  SpreadsheetRuntimeSchema,
  SpreadsheetSubmitParams,
  SpreadsheetSubmitRejection,
  SpreadsheetSubmitResult,
  SpreadsheetSubmitRow,
  SpreadsheetSubmitStatus,
  SpreadsheetValue,
} from '../types'
import {
  getSpreadsheetPathValue,
  normalizeSpreadsheetText,
  setSpreadsheetPathValue,
} from '../utils'
import type { useSpreadsheetContext } from './use-spreadsheet-context'
import type { useSpreadsheetFields } from './use-spreadsheet-fields'
import type { useSpreadsheetRows } from './use-spreadsheet-rows'
import type { useSpreadsheetValues } from './use-spreadsheet-values'

export interface UseSpreadsheetSubmitParams {
  schema: ComputedRef<SpreadsheetRuntimeSchema>
  context: ReturnType<typeof useSpreadsheetContext>
  fields: ReturnType<typeof useSpreadsheetFields>
  rows: ReturnType<typeof useSpreadsheetRows>
  values: ReturnType<typeof useSpreadsheetValues>
  onSubmit?: (
    params: SpreadsheetSubmitParams<unknown, unknown, unknown>,
  ) => void | SpreadsheetSubmitResult | Promise<void | SpreadsheetSubmitResult>
  batchSize?: number
  t: UiToolsTranslator
}

function cloneRecord(record: SpreadsheetRecord): SpreadsheetRecord {
  return structuredClone(record)
}

/**
 * The import itself: creates the new values, builds the payloads with `output`, sends them in
 * batches, and sends rows the server refused back to review.
 */
export function useSpreadsheetSubmit(params: UseSpreadsheetSubmitParams) {
  const status = shallowRef<SpreadsheetSubmitStatus>('idle')
  const progress = shallowRef<{ done: number; total: number }>({ done: 0, total: 0 })
  const rejected = shallowRef<readonly SpreadsheetSubmitRejection[]>([])
  const imported = shallowRef<number>(0)
  const error = shallowRef<unknown>(null)
  let controller: AbortController | null = null

  /**
   * Creates each value answered “create”, once per field and value (a value asked in several
   * scopes is created once), and returns the created values by field and normalized value.
   */
  async function createValues() {
    const created = new Map<string, Map<string, SpreadsheetValue>>()
    const ctx = params.context.ctx.value
    for (const question of params.values.questions.value) {
      if (question.answer?.action !== 'create') continue
      const create = params.fields.byPath.value.get(question.field)?.select?.create
      if (!create) continue
      const key = normalizeSpreadsheetText(question.value)
      const byKey = created.get(question.field) ?? new Map<string, SpreadsheetValue>()
      if (byKey.has(key)) continue
      const option = await create.handler({ ctx, label: question.value })
      const value =
        typeof option === 'object' && option !== null && 'value' in option ? option.value : option
      byKey.set(key, value)
      created.set(question.field, byKey)
    }
    return created
  }

  function withCreatedValues(
    data: SpreadsheetRecord,
    created: ReadonlyMap<string, ReadonlyMap<string, SpreadsheetValue>>,
  ) {
    if (!created.size) return data
    const next = cloneRecord(data)
    for (const [field, byKey] of created) {
      const replace = (item: unknown) => byKey.get(normalizeSpreadsheetText(item)) ?? item
      const value = getSpreadsheetPathValue(next, field)
      setSpreadsheetPathValue(
        next,
        field,
        Array.isArray(value) ? value.map(replace) : replace(value),
      )
    }
    return next
  }

  async function send(only?: ReadonlySet<number>) {
    if (status.value === 'running') return
    const selected = params.rows.importable.value.filter((row) => !only || only.has(row.index))
    status.value = 'running'
    error.value = null
    rejected.value = []
    imported.value = 0
    progress.value = { done: 0, total: selected.length }
    const current = new AbortController()
    controller = current
    // `reset()` aborts the run: stop at the next step and leave the reset state alone.
    const { signal } = current
    const ctx = params.context.ctx.value
    const output = params.schema.value.output
    try {
      const created = await createValues()
      if (signal.aborted) return
      const submitRows: SpreadsheetSubmitRow<unknown, unknown>[] = []
      for (const row of selected) {
        const mode = row.mode === 'update' ? 'update' : 'create'
        const data = withCreatedValues(row.data, created)
        const payload = output
          ? await output({ ctx, existing: row.existing, mode, row: data })
          : data
        submitRows.push({ existing: row.existing, index: row.index, mode, payload })
      }
      if (signal.aborted) return
      const size =
        params.batchSize && params.batchSize > 0 ? params.batchSize : Math.max(submitRows.length, 1)
      const batches: SpreadsheetSubmitRow<unknown, unknown>[][] = []
      for (let start = 0; start < submitRows.length; start += size)
        batches.push(submitRows.slice(start, start + size))
      const refused: SpreadsheetSubmitRejection[] = []
      let done = 0
      for (const [index, batch] of batches.entries()) {
        const base = done
        const result = await params.onSubmit?.({
          batch: { count: batches.length, index },
          create: batch.filter((row) => row.mode === 'create').map((row) => row.payload),
          ctx,
          reportProgress: (count) => {
            if (signal.aborted) return
            progress.value = { done: base + Math.min(count, batch.length), total: selected.length }
          },
          rows: batch,
          signal,
          update: batch.filter((row) => row.mode === 'update').map((row) => row.payload),
        })
        if (signal.aborted) return
        refused.push(...(result?.rejected ?? []))
        done += batch.length
        progress.value = { done, total: selected.length }
      }
      rejected.value = refused
      imported.value = selected.length - new Set(refused.map((entry) => entry.index)).size
      const issues = new Map<number, SpreadsheetRowIssue[]>()
      for (const entry of refused) {
        const list = issues.get(entry.index) ?? []
        list.push({
          code: 'server',
          field: entry.field ?? null,
          level: 'error',
          message: entry.message,
        })
        issues.set(entry.index, list)
      }
      params.rows.setRejections(issues)
      status.value = 'done'
    } catch (nextError) {
      if (signal.aborted) return
      error.value = nextError
      status.value = 'error'
    } finally {
      if (controller === current) controller = null
    }
  }

  async function retryRejected() {
    const indexes = new Set(rejected.value.map((entry) => entry.index))
    if (!indexes.size) return
    params.rows.setRejections(new Map())
    status.value = 'idle'
    await send(indexes)
  }

  function reset() {
    controller?.abort()
    status.value = 'idle'
    progress.value = { done: 0, total: 0 }
    rejected.value = []
    imported.value = 0
    error.value = null
  }

  return { error, imported, progress, rejected, reset, retryRejected, run: () => send(), status }
}
