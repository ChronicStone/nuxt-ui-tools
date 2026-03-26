import type { SpreadsheetReferenceDefinition } from './references'
import type { SpreadsheetRowIssue } from './rows'

export interface SpreadsheetReferenceCandidate<TValue = unknown, TOption = unknown> {
  value: TValue
  label: string
  option: TOption
  score: number
}

export interface SpreadsheetReferenceSourceEntry {
  value: string
  rowIndexes: number[]
}

export interface SpreadsheetReferenceResolution<
  TValue = unknown,
  TOption = unknown,
> {
  referenceField: string
  sourceField: string
  outputField: string
  sourceValue: string
  rowIndexes: number[]
  status: 'matched' | 'unresolved'
  selectedValue?: TValue
  selectedLabel?: string
  candidates: SpreadsheetReferenceCandidate<TValue, TOption>[]
}

export interface SpreadsheetResolvedReferenceRow<TRow = Record<string, unknown>> {
  index: number
  source: readonly unknown[]
  data: TRow
  issues: SpreadsheetRowIssue[]
  isValid: boolean
}

export interface SpreadsheetReferenceQueryRequest {
  referenceField: string
  sourceValue: string
  query: ReturnType<
    NonNullable<
      SpreadsheetReferenceDefinition['getOptions']
    >
  >
}
