import { computed, shallowRef, toValue, watch, type ComputedRef, type MaybeRefOrGetter } from 'vue'

import type {
  ExtractSpreadsheetRow,
  ExtractSpreadsheetSubmitPayload,
  SpreadsheetBinarySource,
  SpreadsheetImportApi,
  SpreadsheetParsedRow,
  SpreadsheetResolvedReferenceRow,
} from '../types'
import { createSpreadsheetInternals, type SpreadsheetInternals } from './use-spreadsheet-internals'

function mapSpreadsheetParsedRows<TSchema>(
  rows: readonly SpreadsheetParsedRow<Record<string, unknown>>[],
): readonly SpreadsheetParsedRow<ExtractSpreadsheetRow<TSchema>>[]
function mapSpreadsheetParsedRows(rows: readonly SpreadsheetParsedRow<Record<string, unknown>>[]) {
  return rows
}

function mapSpreadsheetResolvedRows<TSchema>(
  rows: readonly SpreadsheetResolvedReferenceRow<Record<string, unknown>>[],
): readonly SpreadsheetResolvedReferenceRow<ExtractSpreadsheetRow<TSchema>>[]
function mapSpreadsheetResolvedRows(
  rows: readonly SpreadsheetResolvedReferenceRow<Record<string, unknown>>[],
) {
  return rows
}

function mapSpreadsheetRowData<TSchema>(
  rows: readonly SpreadsheetResolvedReferenceRow<Record<string, unknown>>[],
): readonly ExtractSpreadsheetRow<TSchema>[]
function mapSpreadsheetRowData(
  rows: readonly SpreadsheetResolvedReferenceRow<Record<string, unknown>>[],
) {
  return rows.map((row) => row.data)
}

async function createSpreadsheetSubmitPayloads<TSchema>(params: {
  schema: TSchema
  context: Record<string, unknown>
  rows: readonly SpreadsheetResolvedReferenceRow<Record<string, unknown>>[]
}): Promise<readonly ExtractSpreadsheetSubmitPayload<TSchema>[]>
async function createSpreadsheetSubmitPayloads(params: {
  schema: {
    buildRow?: (params: {
      context: Record<string, unknown>
      row: Record<string, unknown>
    }) => Promise<unknown> | unknown
  }
  context: Record<string, unknown>
  rows: readonly SpreadsheetResolvedReferenceRow<Record<string, unknown>>[]
}) {
  if (!params.schema.buildRow) return params.rows.map((row) => row.data)

  return Promise.all(
    params.rows.map((row) =>
      params.schema.buildRow!({
        context: params.context,
        row: row.data,
      }),
    ),
  )
}

export function useSpreadsheetImport<TSchema extends { importKey: string }>(
  schema: MaybeRefOrGetter<TSchema>,
): SpreadsheetImportApi<TSchema> & { __internals: SpreadsheetInternals<TSchema> } {
  const resolvedSchema = computed<TSchema>(() => toValue(schema))
  const sourceRef = shallowRef<SpreadsheetBinarySource | null>(null)
  const fileNameRef = shallowRef<string | undefined>(undefined)
  const internals = createSpreadsheetInternals({
    rawSchema: resolvedSchema,
    source: sourceRef,
    fileName: fileNameRef,
  })
  const parsedRows = computed(() =>
    mapSpreadsheetParsedRows<TSchema>(internals.rows.parsedRows.value),
  )
  const resolvedRows = computed(() =>
    mapSpreadsheetResolvedRows<TSchema>(internals.resolutions.resolvedRows.value),
  )
  const rowData = computed(() =>
    mapSpreadsheetRowData<TSchema>(internals.resolutions.resolvedRows.value),
  )
  const submitPayloads = computedAsyncPayloads({
    schema: resolvedSchema,
    context: internals.context.contextData,
    rows: computed(() => internals.resolutions.resolvedRows.value),
  })
  const status = computed(() => ({
    initialized:
      internals.source.status.value.initialized ||
      internals.context.status.value.initialized ||
      internals.rows.status.value.initialized,
    isParsingSource: internals.source.status.value.isParsing,
    isLoadingContext:
      internals.context.status.value.isPending || internals.context.status.value.isFetching,
    isParsingRows: internals.rows.status.value.isParsing,
    isReady:
      internals.source.status.value.isReady &&
      internals.context.status.value.isReady &&
      internals.rows.status.value.isReady,
  }))

  function loadSource(params: { source: SpreadsheetBinarySource; fileName?: string }) {
    sourceRef.value = params.source
    fileNameRef.value = params.fileName
  }

  function clearSource() {
    sourceRef.value = null
    fileNameRef.value = undefined
  }

  async function refresh() {
    await internals.source.refreshWorkbook()
    await internals.context.refreshContext()
    await internals.rows.refreshRows()
  }

  return {
    schema: resolvedSchema,
    workbook: internals.source.workbook,
    selection: internals.source.selection,
    activeSheet: internals.source.sheet,
    headers: internals.source.headers,
    headerCells: internals.rows.headerCells,
    rows: internals.source.rows,
    parsedRows,
    resolvedRows,
    rowData,
    submitPayloads,
    rowSummary: internals.rows.summary,
    referenceResolutions: computed(() => internals.resolutions.resolutions.value),
    unresolvedReferenceResolutions: computed(
      () => internals.resolutions.unresolvedResolutions.value,
    ),
    status,
    sourceError: internals.source.error,
    contextError: internals.context.error,
    rowError: internals.rows.error,
    loadSource,
    clearSource,
    setSheetName: internals.source.setSheetName,
    setHeaderRowIndex: internals.source.setHeaderRowIndex,
    assignColumn: ({ headerIndex, columnKey }) =>
      internals.rows.assignColumn(headerIndex, columnKey),
    clearColumnAssignment: (headerIndex) => internals.rows.clearColumnAssignment(headerIndex),
    selectReference: internals.resolutions.selectReference,
    clearReference: internals.resolutions.clearReference,
    refresh,
    __internals: internals,
  }
}

function computedAsyncPayloads<TSchema>(params: {
  schema: ComputedRef<TSchema>
  context: ComputedRef<Record<string, unknown>>
  rows: ComputedRef<readonly SpreadsheetResolvedReferenceRow<Record<string, unknown>>[]>
}) {
  const payloads = shallowRef<readonly ExtractSpreadsheetSubmitPayload<TSchema>[]>([])

  async function refreshPayloads() {
    payloads.value = await createSpreadsheetSubmitPayloads<TSchema>({
      schema: params.schema.value,
      context: params.context.value,
      rows: params.rows.value,
    })
  }

  watch(
    [params.schema, params.context, params.rows],
    () => {
      void refreshPayloads()
    },
    {
      immediate: true,
    },
  )

  return computed(() => payloads.value)
}
