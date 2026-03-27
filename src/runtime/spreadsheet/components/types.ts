import type { SpreadsheetImportApi } from '../types'
import type { SpreadsheetInternals } from '../composables/use-spreadsheet-internals'

export type SpreadsheetComponentApi = SpreadsheetImportApi<{
  importKey: string
  steps?: {
    upload?: {
      title?: string | number | (() => string | number)
      description?: string | number | (() => string | number)
    }
    structure?: {
      title?: string | number | (() => string | number)
      description?: string | number | (() => string | number)
    }
    matching?: {
      title?: string | number | (() => string | number)
      description?: string | number | (() => string | number)
    }
    references?: {
      title?: string | number | (() => string | number)
      description?: string | number | (() => string | number)
    }
    review?: {
      title?: string | number | (() => string | number)
      description?: string | number | (() => string | number)
    }
  }
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
