import type { SpreadsheetImportApi } from '../types'
import type { SpreadsheetInternals } from '../composables/use-spreadsheet-internals'

export type SpreadsheetComponentApi = SpreadsheetImportApi<{
  importKey: string
  source?: {
    accept?: readonly string[]
    maxRecords?: number
  }
}> & {
  __internals: SpreadsheetInternals
}

export interface SpreadsheetStepItem {
  value: string
  title: string
  description: string
  icon: string
  disabled?: boolean
  status?: 'done' | 'active' | 'pending'
}
