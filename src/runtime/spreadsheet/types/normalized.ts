import type { SpreadsheetDynamicBuilder, SpreadsheetResolvedColumns } from './columns'
import type { SpreadsheetContextItem } from './context'

type SchemaContextItems<TSchema> = TSchema extends {
  context?: infer TContextItems extends readonly SpreadsheetContextItem<string, unknown>[]
}
  ? TContextItems
  : readonly []

type SchemaColumns<TSchema> = TSchema extends {
  columns?: infer TColumns
}
  ? TColumns
  : undefined

type SchemaReferences<TSchema> = TSchema extends {
  references?: infer TReferences extends readonly unknown[]
}
  ? TReferences
  : readonly []

type SchemaPipeline<TSchema> = TSchema extends {
  pipeline?: infer TPipeline
}
  ? TPipeline
  : undefined

export type SpreadsheetNormalizedStaticColumns<TSchema> = SpreadsheetResolvedColumns<
  SchemaColumns<TSchema>
> extends {
  static?: infer TStaticColumns extends readonly unknown[]
}
  ? TStaticColumns
  : readonly []

export type SpreadsheetNormalizedDynamicColumns<TSchema> = SpreadsheetResolvedColumns<
  SchemaColumns<TSchema>
> extends {
  dynamic?: (...args: infer _Args) => infer TResult
}
  ? TResult
  : readonly []

export interface SpreadsheetNormalizedColumns<
  TContext = unknown,
  TStaticColumns = readonly unknown[],
  TDynamicColumns = readonly unknown[],
> {
  static: TStaticColumns
  dynamic: (params: {
    context: TContext
    dynamic: SpreadsheetDynamicBuilder
  }) => TDynamicColumns
}

export interface SpreadsheetNormalizedSchema<
  TContextItems extends readonly SpreadsheetContextItem<string, unknown>[] = readonly SpreadsheetContextItem<string, unknown>[],
  TColumns = SpreadsheetNormalizedColumns,
  TReferences extends readonly unknown[] = readonly unknown[],
  TPipeline = unknown,
> {
  importKey: string
  source?: import('./schema').SpreadsheetSourceDefinition
  sheet?: import('./schema').SpreadsheetSheetDefinition
  header?: import('./schema').SpreadsheetHeaderDefinition
  matching?: import('./schema').SpreadsheetMatchingDefinition
  context: TContextItems
  columns: TColumns
  references: TReferences
  pipeline?: TPipeline
  review?: import('./schema').SpreadsheetReviewDefinition
}

export type NormalizeSpreadsheetSchema<TSchema> = SpreadsheetNormalizedSchema<
  SchemaContextItems<TSchema>,
  SpreadsheetNormalizedColumns<
    import('./inference').ExtractSpreadsheetContextData<TSchema>,
    SpreadsheetNormalizedStaticColumns<TSchema>,
    SpreadsheetNormalizedDynamicColumns<TSchema>
  >,
  SchemaReferences<TSchema>,
  SchemaPipeline<TSchema>
>
