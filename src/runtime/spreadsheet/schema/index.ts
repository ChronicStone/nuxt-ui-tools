import type {
  SpreadsheetColumnsDefinition,
  SpreadsheetContextDataFromItems,
  SpreadsheetContextItem,
  SpreadsheetFileDefinition,
  SpreadsheetHeaderStepDefinition,
  SpreadsheetMatchingStepDefinition,
  SpreadsheetReferenceBuilder,
  SpreadsheetSchemaWithRefine,
  SpreadsheetResolvedColumns,
  SpreadsheetReviewStepDefinition,
  SpreadsheetRowData,
  SpreadsheetSheetStepDefinition,
  SpreadsheetStepsDefinition,
} from '../types'
import { resolveSpreadsheetColumns } from '../utils/builders'

type SpreadsheetResolvedColumnsInput<TColumns> = [TColumns] extends [
  SpreadsheetColumnsDefinition<any>,
]
  ? SpreadsheetResolvedColumns<TColumns>
  : undefined

type SpreadsheetExtractedReference<TValue> = Extract<
  TValue,
  import('../types').SpreadsheetReferenceDefinition<any, any, any>
>

type SpreadsheetResolvedReferences<TReferences> = TReferences extends (
  ...args: infer _Args
) => infer TResult
  ? TResult extends readonly unknown[]
    ? readonly SpreadsheetExtractedReference<TResult[number]>[]
    : readonly []
  : TReferences extends readonly unknown[]
    ? readonly SpreadsheetExtractedReference<TReferences[number]>[]
    : readonly []

type SpreadsheetSchemaDefinition<
  TImportKey extends string,
  TContextItems extends readonly SpreadsheetContextItem<string, unknown>[],
  TColumns,
  TReferences,
  TBuildRow,
> = {
  importKey: TImportKey
  file?: SpreadsheetFileDefinition
  sheet?: SpreadsheetSheetStepDefinition
  header?: SpreadsheetHeaderStepDefinition
  matching?: SpreadsheetMatchingStepDefinition
  steps?: SpreadsheetStepsDefinition
  review?: SpreadsheetReviewStepDefinition
  context?: TContextItems
  columns?: TColumns
  references?: TReferences
  buildRow?: TBuildRow
}

type SpreadsheetBuildRowInput<TContext, TRow, TResult> = (params: {
  context: TContext
  row: TRow
}) => TResult | Promise<TResult>

type SpreadsheetSchemaReturn<
  TImportKey extends string,
  TContextItems extends readonly SpreadsheetContextItem<string, unknown>[],
  TColumns,
  TReferences,
  TBuildRow,
> = Omit<
  SpreadsheetSchemaDefinition<TImportKey, TContextItems, TColumns, TReferences, TBuildRow>,
  'columns'
> & {
  columns?: SpreadsheetResolvedColumnsInput<TColumns>
  __columnsInput?: TColumns
}

type SpreadsheetDefinedSchemaReturn<
  TImportKey extends string,
  TContextItems extends readonly SpreadsheetContextItem<string, unknown>[],
  TColumns,
  TReferences,
  TBuildRow,
> = SpreadsheetSchemaWithRefine<
  SpreadsheetSchemaReturn<TImportKey, TContextItems, TColumns, TReferences, TBuildRow>
>

function withSpreadsheetRefine<TSchema extends { importKey: string }>(
  schema: TSchema,
): SpreadsheetSchemaWithRefine<TSchema>
function withSpreadsheetRefine(schema: { importKey: string; relations?: readonly unknown[] }) {
  return {
    ...schema,
    refine(refinement: { relations: readonly unknown[] }) {
      return withSpreadsheetRefine({
        ...schema,
        relations: refinement.relations,
      })
    },
  }
}

export function defineSpreadsheetSchema<
  const TImportKey extends string,
  const TContextItems extends readonly SpreadsheetContextItem<string, unknown>[] = readonly [],
  TContextData = SpreadsheetContextDataFromItems<TContextItems>,
  const TColumns extends SpreadsheetColumnsDefinition<TContextData> | undefined =
    | SpreadsheetColumnsDefinition<TContextData>
    | undefined,
  const TReferences extends readonly unknown[] | undefined = readonly unknown[] | undefined,
  TReferenceRow = SpreadsheetRowData<SpreadsheetResolvedColumnsInput<TColumns>, readonly []>,
  TResolvedReferences = SpreadsheetResolvedReferences<TReferences>,
  TFinalRow = SpreadsheetRowData<SpreadsheetResolvedColumnsInput<TColumns>, TResolvedReferences>,
  TBuildRowResult = never,
>(
  schema: SpreadsheetSchemaDefinition<
    TImportKey,
    TContextItems,
    TColumns,
    TReferences | ((reference: SpreadsheetReferenceBuilder<TReferenceRow>) => TReferences),
    SpreadsheetBuildRowInput<TContextData, TFinalRow, TBuildRowResult> | undefined
  > & {
    relations?: undefined
  },
): SpreadsheetDefinedSchemaReturn<
  TImportKey,
  TContextItems,
  TColumns,
  TReferences,
  SpreadsheetBuildRowInput<TContextData, TFinalRow, TBuildRowResult> | undefined
>
export function defineSpreadsheetSchema(schema: {
  importKey: string
  columns?: SpreadsheetColumnsDefinition<unknown>
  relations?: undefined
}) {
  if (!schema.columns) return withSpreadsheetRefine(schema)

  return withSpreadsheetRefine({
    ...schema,
    columns: resolveSpreadsheetColumns(schema.columns),
  })
}

export * from './normalize'
