import type { LazyTextValue, NestedPaths } from '#ui-tools/shared/types/utils'

import type { SpreadsheetColumnsDefinition, SpreadsheetResolvedColumns } from './columns'
import type { SpreadsheetContextDataFromItems, SpreadsheetContextItem } from './context'
import type { ExtractSpreadsheetValidationRow, SpreadsheetRowData } from './inference'
import type { SpreadsheetFieldRules, SpreadsheetRuleBuilder } from './validation'
import type { SpreadsheetValue } from './shared'

export interface SpreadsheetFileDefinition {
  accept?: readonly string[]
  maxRecords?: number
}

export interface SpreadsheetStepTextDefinition {
  title?: LazyTextValue
  description?: LazyTextValue
}

export interface SpreadsheetSheetStepDefinition extends SpreadsheetStepTextDefinition {
  strategy?: 'fixed' | 'selection' | 'auto'
}

export interface SpreadsheetHeaderStepDefinition extends SpreadsheetStepTextDefinition {
  strategy?: 'fixed' | 'first-row' | 'selection' | 'detected'
}

export interface SpreadsheetMatchingStepDefinition extends SpreadsheetStepTextDefinition {
  strategy?: 'template' | 'smart' | 'manual'
}

export interface SpreadsheetReviewStepDefinition extends SpreadsheetStepTextDefinition {
  allowInvalidSubmit?: boolean
}

export interface SpreadsheetStructureStepDefinition extends SpreadsheetStepTextDefinition {
  sheet?: SpreadsheetSheetStepDefinition
  header?: SpreadsheetHeaderStepDefinition
}

export interface SpreadsheetStepsDefinition {
  upload?: SpreadsheetStepTextDefinition
  structure?: SpreadsheetStructureStepDefinition
  matching?: SpreadsheetMatchingStepDefinition
  references?: SpreadsheetStepTextDefinition
  review?: SpreadsheetReviewStepDefinition
}

type SpreadsheetValueAtPath<
  TRow,
  TPath extends string,
> = TPath extends `${infer TKey}.${infer TRest}`
  ? TKey extends keyof TRow
    ? SpreadsheetValueAtPath<NonNullable<TRow[TKey]>, TRest>
    : never
  : TPath extends keyof TRow
    ? TRow[TPath]
    : never

type SpreadsheetRelationPath<TRow> = Extract<NestedPaths<TRow>, string>

export interface SpreadsheetRelationDefinition<
  TRow,
  TColumn extends SpreadsheetRelationPath<TRow> = SpreadsheetRelationPath<TRow>,
> {
  column: TColumn
  condition?: (row: TRow) => boolean
  rules: (
    rules: SpreadsheetRuleBuilder,
    row: TRow,
  ) => SpreadsheetFieldRules<SpreadsheetValueAtPath<TRow, TColumn>>
}

export type SpreadsheetRelationsDefinition<TRow> = readonly {
  [TColumn in SpreadsheetRelationPath<TRow>]: SpreadsheetRelationDefinition<TRow, TColumn>
}[SpreadsheetRelationPath<TRow>][]

export type SpreadsheetBuildRowDefinition<TContext = unknown, TRow = unknown> = (params: {
  context: TContext
  row: TRow
}) => SpreadsheetValue | Promise<SpreadsheetValue>

export interface SpreadsheetSchema<
  TContextItems extends readonly SpreadsheetContextItem<string, unknown>[] = readonly [],
  TColumns extends SpreadsheetColumnsDefinition<SpreadsheetContextDataFromItems<TContextItems>> =
    SpreadsheetColumnsDefinition<SpreadsheetContextDataFromItems<TContextItems>>,
  TReferences = readonly unknown[],
  TRelations = SpreadsheetRelationsDefinition<
    SpreadsheetRowData<SpreadsheetResolvedColumns<TColumns>, TReferences>
  >,
  TBuildRow = SpreadsheetBuildRowDefinition<
    SpreadsheetContextDataFromItems<TContextItems>,
    SpreadsheetRowData<SpreadsheetResolvedColumns<TColumns>, TReferences>
  >,
> {
  importKey: string
  file?: SpreadsheetFileDefinition
  sheet?: SpreadsheetSheetStepDefinition
  header?: SpreadsheetHeaderStepDefinition
  matching?: SpreadsheetMatchingStepDefinition
  steps?: SpreadsheetStepsDefinition
  context?: TContextItems
  columns?: TColumns
  references?: TReferences
  relations?: TRelations
  buildRow?: TBuildRow
  review?: SpreadsheetReviewStepDefinition
}

export interface SpreadsheetSchemaRefinement<TRow> {
  relations?: SpreadsheetRelationsDefinition<TRow>
}

export type SpreadsheetSchemaWithRefine<TSchema extends { importKey: string }> = TSchema & {
  refine<
    const TRelations extends SpreadsheetRelationsDefinition<
      ExtractSpreadsheetValidationRow<TSchema>
    >,
  >(refinement: {
    relations: TRelations
  }): SpreadsheetSchemaWithRefine<
    TSchema & {
      relations: SpreadsheetRelationsDefinition<ExtractSpreadsheetValidationRow<TSchema>>
    }
  >
}

export type BuildSpreadsheetSchema<
  TContextItems extends readonly SpreadsheetContextItem<string, unknown>[] = readonly [],
  TColumns extends SpreadsheetColumnsDefinition<SpreadsheetContextDataFromItems<TContextItems>> =
    SpreadsheetColumnsDefinition<SpreadsheetContextDataFromItems<TContextItems>>,
  TReferences = readonly unknown[],
  TRelations = SpreadsheetRelationsDefinition<
    SpreadsheetRowData<SpreadsheetResolvedColumns<TColumns>, TReferences>
  >,
  TBuildRow = SpreadsheetBuildRowDefinition<
    SpreadsheetContextDataFromItems<TContextItems>,
    SpreadsheetRowData<SpreadsheetResolvedColumns<TColumns>, TReferences>
  >,
  TExtra extends { importKey: string } = { importKey: string },
> = TExtra & SpreadsheetSchema<TContextItems, TColumns, TReferences, TRelations, TBuildRow>

export type ResolvedSpreadsheetSchema<TSchema> = TSchema extends { columns?: infer TColumns }
  ? TSchema & {
      columns?: SpreadsheetResolvedColumns<TColumns>
    }
  : TSchema
