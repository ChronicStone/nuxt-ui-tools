import type { SpreadsheetColumnsDefinition, SpreadsheetResolvedColumns } from './columns'
import type { SpreadsheetContextDataFromItems, SpreadsheetContextItem } from './context'
import type { SpreadsheetRowData } from './inference'

export interface SpreadsheetFileDefinition {
  accept?: readonly string[]
  maxRecords?: number
}

export interface SpreadsheetSheetDefinition {
  strategy?: 'fixed' | 'selection' | 'auto'
}

export interface SpreadsheetHeaderDefinition {
  strategy?: 'fixed' | 'first-row' | 'selection' | 'detected'
}

export interface SpreadsheetMatchingDefinition {
  strategy?: 'template' | 'smart' | 'manual'
}

export interface SpreadsheetReviewDefinition {
  allowInvalidSubmit?: boolean
}

export type SpreadsheetBuildRowDefinition<TContext = unknown, TRow = unknown> = (params: {
  context: TContext
  row: TRow
}) => unknown | Promise<unknown>

export interface SpreadsheetSchema<
  TContextItems extends readonly SpreadsheetContextItem<string, unknown>[] = readonly [],
  TColumns extends SpreadsheetColumnsDefinition<SpreadsheetContextDataFromItems<TContextItems>> = SpreadsheetColumnsDefinition<
    SpreadsheetContextDataFromItems<TContextItems>
  >,
  TReferences = readonly unknown[],
  TBuildRow = SpreadsheetBuildRowDefinition<
    SpreadsheetContextDataFromItems<TContextItems>,
    SpreadsheetRowData<SpreadsheetResolvedColumns<TColumns>, TReferences>
  >,
> {
  importKey: string
  file?: SpreadsheetFileDefinition
  sheet?: SpreadsheetSheetDefinition
  header?: SpreadsheetHeaderDefinition
  matching?: SpreadsheetMatchingDefinition
  context?: TContextItems
  columns?: TColumns
  references?: TReferences
  buildRow?: TBuildRow
  review?: SpreadsheetReviewDefinition
}

export type BuildSpreadsheetSchema<
  TContextItems extends readonly SpreadsheetContextItem<string, unknown>[] = readonly [],
  TColumns extends SpreadsheetColumnsDefinition<SpreadsheetContextDataFromItems<TContextItems>> = SpreadsheetColumnsDefinition<
    SpreadsheetContextDataFromItems<TContextItems>
  >,
  TReferences = readonly unknown[],
  TBuildRow = SpreadsheetBuildRowDefinition<
    SpreadsheetContextDataFromItems<TContextItems>,
    SpreadsheetRowData<SpreadsheetResolvedColumns<TColumns>, TReferences>
  >,
  TExtra extends { importKey: string } = { importKey: string },
> = TExtra & SpreadsheetSchema<TContextItems, TColumns, TReferences, TBuildRow>

export type ResolvedSpreadsheetSchema<TSchema> = TSchema extends { columns?: infer TColumns }
  ? TSchema & {
      columns?: SpreadsheetResolvedColumns<TColumns>
    }
  : TSchema
