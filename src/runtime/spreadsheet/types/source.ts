import type { ComputedRef, Ref } from 'vue'

export interface SpreadsheetWorkbookSheet {
  name: string
  rows: readonly (readonly unknown[])[]
}

export interface SpreadsheetWorkbookData {
  fileName?: string
  sheets: readonly SpreadsheetWorkbookSheet[]
}

export interface SpreadsheetWorkbookSelection {
  sheetName?: string
  headerRowIndex: number
}

export interface SpreadsheetWorkbookStatus {
  initialized: boolean
  isParsing: boolean
  isReady: boolean
}

export type SpreadsheetBinarySource = ArrayBuffer | Uint8Array | Blob | File

export type SpreadsheetBinaryRef =
  | Ref<SpreadsheetBinarySource | null>
  | ComputedRef<SpreadsheetBinarySource | null>
