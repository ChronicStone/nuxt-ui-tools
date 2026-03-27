import type { SpreadsheetColumnsDefinition, SpreadsheetResolvedColumns } from './columns'
import type { SpreadsheetContextDataFromItems, SpreadsheetContextItem } from './context'
import type { ExtractSpreadsheetValidationRow, SpreadsheetRowData } from './inference'
import type { NestedPaths } from '../../shared/types/utils'
import type { SpreadsheetFieldRules, SpreadsheetRuleBuilder } from './validation'

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

type SpreadsheetValueAtPath<TRow, TPath extends string> = TPath extends `${infer TKey}.${infer TRest}`
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

export type SpreadsheetRelationsDefinition<TRow> =
  readonly {
    [TColumn in SpreadsheetRelationPath<TRow>]: SpreadsheetRelationDefinition<TRow, TColumn>
  }[SpreadsheetRelationPath<TRow>][]

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
  sheet?: SpreadsheetSheetDefinition
  header?: SpreadsheetHeaderDefinition
  matching?: SpreadsheetMatchingDefinition
  context?: TContextItems
  columns?: TColumns
  references?: TReferences
  relations?: TRelations
  buildRow?: TBuildRow
  review?: SpreadsheetReviewDefinition
}

export interface SpreadsheetSchemaRefinement<
  TRow,
> {
  relations?: SpreadsheetRelationsDefinition<TRow>
}

export type SpreadsheetSchemaWithRefine<
  TSchema extends { importKey: string },
> = TSchema & {
  refine<
    const TRelations extends SpreadsheetRelationsDefinition<ExtractSpreadsheetValidationRow<TSchema>>,
  >(
    refinement: {
      relations: TRelations
    },
  ): SpreadsheetSchemaWithRefine<
    TSchema & { relations: SpreadsheetRelationsDefinition<ExtractSpreadsheetValidationRow<TSchema>> }
  >
}

export type BuildSpreadsheetSchema<
  TContextItems extends readonly SpreadsheetContextItem<string, unknown>[] = readonly [],
  TColumns extends SpreadsheetColumnsDefinition<SpreadsheetContextDataFromItems<TContextItems>> = SpreadsheetColumnsDefinition<
    SpreadsheetContextDataFromItems<TContextItems>
  >,
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
