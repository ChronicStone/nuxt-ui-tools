import type { SpreadsheetQueryDefinition } from './shared'

export interface SpreadsheetReferenceDefinition<
  TContext = unknown,
  TRow = unknown,
  TOutputField extends string = string,
  TValue = unknown,
  TOption = unknown,
> {
  key: string
  sourceField: string
  target: {
    options?: readonly TOption[]
    query?: (params: {
      context: TContext
      row: TRow
      search: string
    }) => SpreadsheetQueryDefinition<readonly TOption[]>
    optionValue: (option: TOption) => TValue
    optionLabel: (option: TOption) => string
  }
  output: {
    field: TOutputField
  }
}
