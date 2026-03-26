import type { ComputedRef, ShallowRef } from 'vue'

import type {
  ExtractSpreadsheetRow,
  ExtractSpreadsheetSubmitPayload,
} from './inference'
import type {
  SpreadsheetReferenceResolution,
  SpreadsheetResolvedReferenceRow,
} from './reference-session'
import type {
  SpreadsheetBinarySource,
  SpreadsheetWorkbookData,
  SpreadsheetWorkbookSelection,
  SpreadsheetWorkbookSheet,
} from './source'
import type { SpreadsheetHeaderCell, SpreadsheetParsedRow, SpreadsheetRowSummary } from './rows'

export interface SpreadsheetImportStatus {
  initialized: boolean
  isParsingSource: boolean
  isLoadingContext: boolean
  isParsingRows: boolean
  isReady: boolean
}

export interface SpreadsheetImportApi<TSchema> {
  schema: ComputedRef<TSchema>
  workbook: ShallowRef<SpreadsheetWorkbookData | null>
  selection: ShallowRef<SpreadsheetWorkbookSelection>
  activeSheet: ComputedRef<SpreadsheetWorkbookSheet | null>
  headers: ComputedRef<readonly unknown[]>
  headerCells: ComputedRef<SpreadsheetHeaderCell[]>
  rows: ComputedRef<readonly (readonly unknown[])[]>
  parsedRows: ComputedRef<readonly SpreadsheetParsedRow<ExtractSpreadsheetRow<TSchema>>[]>
  resolvedRows: ComputedRef<readonly SpreadsheetResolvedReferenceRow<ExtractSpreadsheetRow<TSchema>>[]>
  rowData: ComputedRef<readonly ExtractSpreadsheetRow<TSchema>[]>
  submitPayloads: ComputedRef<readonly ExtractSpreadsheetSubmitPayload<TSchema>[]>
  rowSummary: ShallowRef<SpreadsheetRowSummary>
  referenceResolutions: ComputedRef<readonly SpreadsheetReferenceResolution[]>
  unresolvedReferenceResolutions: ComputedRef<readonly SpreadsheetReferenceResolution[]>
  status: ComputedRef<SpreadsheetImportStatus>
  sourceError: ShallowRef<unknown>
  contextError: ComputedRef<unknown>
  rowError: ShallowRef<unknown>
  loadSource: (params: {
    source: SpreadsheetBinarySource
    fileName?: string
  }) => void
  clearSource: () => void
  setSheetName: (sheetName: string) => void
  setHeaderRowIndex: (headerRowIndex: number) => void
  assignColumn: (params: {
    headerIndex: number
    columnKey: string
  }) => void
  clearColumnAssignment: (headerIndex: number) => void
  selectReference: (params: {
    referenceField: string
    sourceValue: string
    selectedValue: unknown
    selectedLabel: string
  }) => void
  clearReference: (params: {
    referenceField: string
    sourceValue: string
  }) => void
  refresh: () => Promise<void>
}
