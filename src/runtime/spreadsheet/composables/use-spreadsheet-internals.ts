import { computed, inject, provide, toValue, type ComputedRef, type InjectionKey, type Ref } from 'vue'

import type { SpreadsheetBinaryRef } from '../types'
import { normalizeSpreadsheetSchema } from '../schema'
import { useSpreadsheetContext } from './use-spreadsheet-context'
import { useSpreadsheetReferences } from './use-spreadsheet-references'
import { useSpreadsheetRows } from './use-spreadsheet-rows'
import { useSpreadsheetSource } from './use-spreadsheet-source'

type SpreadsheetSchemaSource<TValue extends { importKey: string }> =
  | TValue
  | Ref<TValue>
  | ComputedRef<TValue>
  | (() => TValue)
type SpreadsheetMaybeValue<TValue> =
  | TValue
  | Ref<TValue>
  | ComputedRef<TValue>
  | (() => TValue)

function resolveSpreadsheetSchemaSource<TValue extends { importKey: string }>(
  schema: SpreadsheetSchemaSource<TValue>,
) {
  return toValue(schema)
}

function resolveSpreadsheetValue<TValue>(value: SpreadsheetMaybeValue<TValue>) {
  return toValue(value)
}

function createSpreadsheetInternals<TSchema extends { importKey: string }>(options: {
  rawSchema: SpreadsheetSchemaSource<TSchema>
  source: SpreadsheetBinaryRef
  fileName?: SpreadsheetMaybeValue<string | undefined>
}) {
  const publicSchema = computed(() => resolveSpreadsheetSchemaSource(options.rawSchema))
  const schema = computed(() => normalizeSpreadsheetSchema(publicSchema.value))
  const source = useSpreadsheetSource({
    source: options.source,
    fileName: computed(() => options.fileName ? resolveSpreadsheetValue(options.fileName) : undefined),
  })
  const context = useSpreadsheetContext({
    schema,
  })
  const rows = useSpreadsheetRows({
    schema,
    contextData: context.contextData,
    headers: source.headers,
    rows: source.rows,
  })
  const references = useSpreadsheetReferences({
    schema,
    contextData: context.contextData,
    rows: computed(() => rows.parsedRows.value),
  })

  return {
    schema,
    source,
    context,
    rows,
    references,
  }
}

const SPREADSHEET_INTERNALS_KEY = Symbol('nuxt-ui-tools.spreadsheet.internals') as InjectionKey<SpreadsheetInternals>

function provideSpreadsheetInternals(internals: SpreadsheetInternals) {
  provide(SPREADSHEET_INTERNALS_KEY, internals)
}

function useProvideSpreadsheetInternals(options: {
  rawSchema: SpreadsheetSchemaSource<{ importKey: string }>
  source: SpreadsheetBinaryRef
  fileName?: SpreadsheetMaybeValue<string | undefined>
}) {
  const internals = createSpreadsheetInternals(options)
  provideSpreadsheetInternals(internals)
  return internals
}

function useSpreadsheetInternals() {
  const internals = inject(SPREADSHEET_INTERNALS_KEY, null)
  if (!internals) throw new Error('useSpreadsheetInternals must be called inside a spreadsheet provider')
  return internals
}

export type SpreadsheetInternals<TSchema extends { importKey: string } = { importKey: string }> =
  ReturnType<typeof createSpreadsheetInternals<TSchema>>

export {
  createSpreadsheetInternals,
  provideSpreadsheetInternals,
  useProvideSpreadsheetInternals,
  useSpreadsheetInternals,
}
