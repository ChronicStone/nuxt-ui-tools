import { computed, shallowRef, toValue, watch } from 'vue'
import type { ComputedRef, MaybeRefOrGetter } from 'vue'

import type {
  ExtractSpreadsheetRow,
  ExtractSpreadsheetSubmitPayload,
  SpreadsheetBinarySource,
  SpreadsheetImportApi,
  SpreadsheetParsedRow,
  SpreadsheetRecord,
  SpreadsheetResolvedReferenceRow,
} from '../types'
import { createSpreadsheetInternals } from './use-spreadsheet-internals'
import type { SpreadsheetInternals } from './use-spreadsheet-internals'

function mapSpreadsheetParsedRows<TSchema>(
  rows: readonly SpreadsheetParsedRow<SpreadsheetRecord>[],
): readonly SpreadsheetParsedRow<ExtractSpreadsheetRow<TSchema>>[]
function mapSpreadsheetParsedRows(rows: readonly SpreadsheetParsedRow<SpreadsheetRecord>[]) {
  return rows
}

function mapSpreadsheetResolvedRows<TSchema>(
  rows: readonly SpreadsheetResolvedReferenceRow<SpreadsheetRecord>[],
): readonly SpreadsheetResolvedReferenceRow<ExtractSpreadsheetRow<TSchema>>[]
function mapSpreadsheetResolvedRows(
  rows: readonly SpreadsheetResolvedReferenceRow<SpreadsheetRecord>[],
) {
  return rows
}

function mapSpreadsheetRowData<TSchema>(
  rows: readonly SpreadsheetResolvedReferenceRow<SpreadsheetRecord>[],
): readonly ExtractSpreadsheetRow<TSchema>[]
function mapSpreadsheetRowData(
  rows: readonly SpreadsheetResolvedReferenceRow<SpreadsheetRecord>[],
) {
  return rows.map((row) => row.data)
}

async function createSpreadsheetSubmitPayloads<TSchema>(params: {
  schema: TSchema
  context: SpreadsheetRecord
  rows: readonly SpreadsheetResolvedReferenceRow<SpreadsheetRecord>[]
}): Promise<readonly ExtractSpreadsheetSubmitPayload<TSchema>[]>
async function createSpreadsheetSubmitPayloads(params: {
  schema: {
    buildRow?: (params: {
      context: SpreadsheetRecord
      row: SpreadsheetRecord
    }) => Promise<SpreadsheetRecord> | SpreadsheetRecord
  }
  context: SpreadsheetRecord
  rows: readonly SpreadsheetResolvedReferenceRow<SpreadsheetRecord>[]
}) {
  if (!params.schema.buildRow) {
    return params.rows.map((row) => row.data)
  }

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
  const fileNameRef = shallowRef<string | undefined>()
  const internals = createSpreadsheetInternals({
    fileName: fileNameRef,
    rawSchema: resolvedSchema,
    source: sourceRef,
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
    context: internals.context.contextData,
    rows: computed(() => internals.resolutions.resolvedRows.value),
    schema: resolvedSchema,
  })
  const status = computed(() => ({
    initialized:
      internals.source.status.value.initialized ||
      internals.context.status.value.initialized ||
      internals.rows.status.value.initialized,
    isLoadingContext:
      internals.context.status.value.isPending || internals.context.status.value.isFetching,
    isParsingRows: internals.rows.status.value.isParsing,
    isParsingSource: internals.source.status.value.isParsing,
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
    __internals: internals,
    activeSheet: internals.source.sheet,
    assignColumn: ({ headerIndex, columnKey }) =>
      internals.rows.assignColumn(headerIndex, columnKey),
    clearColumnAssignment: (headerIndex) => internals.rows.clearColumnAssignment(headerIndex),
    clearReference: internals.resolutions.clearReference,
    clearSource,
    contextError: internals.context.error,
    headerCells: internals.rows.headerCells,
    headers: internals.source.headers,
    loadSource,
    parsedRows,
    referenceResolutions: computed(() => internals.resolutions.resolutions.value),
    refresh,
    resolvedRows,
    rowData,
    rowError: internals.rows.error,
    rowSummary: internals.rows.summary,
    rows: internals.source.rows,
    schema: resolvedSchema,
    selectReference: internals.resolutions.selectReference,
    selection: internals.source.selection,
    setHeaderRowIndex: internals.source.setHeaderRowIndex,
    setSheetName: internals.source.setSheetName,
    sourceError: internals.source.error,
    status,
    submitPayloads,
    unresolvedReferenceResolutions: computed(
      () => internals.resolutions.unresolvedResolutions.value,
    ),
    workbook: internals.source.workbook,
  }
}

function computedAsyncPayloads<TSchema>(params: {
  schema: ComputedRef<TSchema>
  context: ComputedRef<SpreadsheetRecord>
  rows: ComputedRef<readonly SpreadsheetResolvedReferenceRow<SpreadsheetRecord>[]>
}) {
  const payloads = shallowRef<readonly ExtractSpreadsheetSubmitPayload<TSchema>[]>([])

  async function refreshPayloads() {
    payloads.value = await createSpreadsheetSubmitPayloads<TSchema>({
      context: params.context.value,
      rows: params.rows.value,
      schema: params.schema.value,
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
