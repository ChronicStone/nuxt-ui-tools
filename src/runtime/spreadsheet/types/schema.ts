import type { SpreadsheetColumnsDefinition, SpreadsheetResolvedColumns } from './columns'
import type { SpreadsheetContextItem } from './context'
import type { SpreadsheetPipelineDefinition } from './pipeline'
import type { SpreadsheetContextDataFromItems } from './context'
import type { SpreadsheetRowData } from './inference'

export interface SpreadsheetSourceDefinition {
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

export interface SpreadsheetSchema<
  TContextItems extends readonly SpreadsheetContextItem<string, unknown>[] = readonly [],
  TColumns extends SpreadsheetColumnsDefinition<SpreadsheetContextDataFromItems<TContextItems>> = SpreadsheetColumnsDefinition<
    SpreadsheetContextDataFromItems<TContextItems>
  >,
  TReferences extends readonly unknown[] = readonly [],
  TPipeline extends SpreadsheetPipelineDefinition<
    SpreadsheetContextDataFromItems<TContextItems>,
    SpreadsheetRowData<SpreadsheetResolvedColumns<TColumns>, TReferences>
  > | undefined = SpreadsheetPipelineDefinition<
    SpreadsheetContextDataFromItems<TContextItems>,
    SpreadsheetRowData<SpreadsheetResolvedColumns<TColumns>, TReferences>
  >,
> {
  importKey: string
  source?: SpreadsheetSourceDefinition
  sheet?: SpreadsheetSheetDefinition
  header?: SpreadsheetHeaderDefinition
  matching?: SpreadsheetMatchingDefinition
  context?: TContextItems
  columns?: TColumns
  references?: TReferences
  pipeline?: TPipeline
  review?: SpreadsheetReviewDefinition
}

export type BuildSpreadsheetSchema<
  TContextItems extends readonly SpreadsheetContextItem<string, unknown>[] = readonly [],
  TColumns extends SpreadsheetColumnsDefinition<SpreadsheetContextDataFromItems<TContextItems>> = SpreadsheetColumnsDefinition<
    SpreadsheetContextDataFromItems<TContextItems>
  >,
  TReferences extends readonly unknown[] = readonly [],
  TPipeline extends SpreadsheetPipelineDefinition<
    SpreadsheetContextDataFromItems<TContextItems>,
    SpreadsheetRowData<SpreadsheetResolvedColumns<TColumns>, TReferences>
  > | undefined = SpreadsheetPipelineDefinition<
    SpreadsheetContextDataFromItems<TContextItems>,
    SpreadsheetRowData<SpreadsheetResolvedColumns<TColumns>, TReferences>
  >,
  TExtra extends { importKey: string } = { importKey: string },
> = TExtra & SpreadsheetSchema<TContextItems, TColumns, TReferences, TPipeline>

export type ResolvedSpreadsheetSchema<TSchema> = TSchema extends { columns?: infer TColumns }
  ? TSchema & {
      columns?: SpreadsheetResolvedColumns<TColumns>
    }
  : TSchema
