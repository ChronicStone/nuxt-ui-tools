import { computed, inject, provide, toValue } from 'vue'
import type { ComputedRef, InjectionKey, Ref } from 'vue'

import { normalizeSpreadsheetSchema } from '../schema'
import type { SpreadsheetBinaryRef } from '../types'
import { useSpreadsheetContext } from './use-spreadsheet-context'
import { useSpreadsheetResolutions } from './use-spreadsheet-resolutions'
import { useSpreadsheetRows } from './use-spreadsheet-rows'
import { useSpreadsheetSource } from './use-spreadsheet-source'

type SpreadsheetSchemaSource<TValue extends { importKey: string }> =
  | TValue
  | Ref<TValue>
  | ComputedRef<TValue>
  | (() => TValue)
type SpreadsheetMaybeValue<TValue> = TValue | Ref<TValue> | ComputedRef<TValue> | (() => TValue)

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
    fileName: computed(() =>
      options.fileName ? resolveSpreadsheetValue(options.fileName) : undefined,
    ),
    source: options.source,
  })
  const context = useSpreadsheetContext({
    schema,
  })
  const rows = useSpreadsheetRows({
    contextData: context.contextData,
    headers: source.headers,
    rows: source.rows,
    schema,
  })
  const resolutions = useSpreadsheetResolutions({
    contextData: context.contextData,
    rows: computed(() => rows.parsedRows.value),
    schema,
  })

  return {
    context,
    references: resolutions,
    resolutions,
    rows,
    schema,
    source,
  }
}

// SAFETY: this module creates and provides the only value stored under this injection key.
const SPREADSHEET_INTERNALS_KEY = Symbol(
  'nuxt-ui-tools.spreadsheet.internals',
) as InjectionKey<SpreadsheetInternals>

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
  if (!internals) {
    throw new Error('useSpreadsheetInternals must be called inside a spreadsheet provider')
  }
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
