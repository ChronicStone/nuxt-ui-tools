import type { SpreadsheetDynamicBuilder, SpreadsheetResolvedColumns } from './columns'
import type { SpreadsheetContextItem } from './context'
import type { SpreadsheetResolutionDefinition } from './resolution'

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
  references?: (...args: infer _Args) => infer TReferences extends readonly unknown[]
}
  ? TReferences
  : TSchema extends {
  references?: infer TReferences extends readonly unknown[]
}
  ? TReferences
  : readonly []

type SchemaBuildRow<TSchema> = TSchema extends {
  buildRow?: infer TBuildRow
}
  ? TBuildRow
  : undefined

type SchemaRelations<TSchema> = TSchema extends {
  relations?: infer TRelations
}
  ? Exclude<TRelations, undefined> extends readonly unknown[]
    ? Exclude<TRelations, undefined>
    : readonly []
  : readonly []

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
    dynamic: SpreadsheetDynamicBuilder<TContext>
  }) => TDynamicColumns
}

export interface SpreadsheetNormalizedSchema<
  TContextItems extends readonly SpreadsheetContextItem<string, unknown>[] = readonly SpreadsheetContextItem<string, unknown>[],
  TColumns = SpreadsheetNormalizedColumns,
  TReferences extends readonly unknown[] = readonly unknown[],
  TResolutions extends readonly SpreadsheetResolutionDefinition[] = readonly SpreadsheetResolutionDefinition[],
  TRelations extends readonly unknown[] = readonly unknown[],
  TBuildRow = unknown,
> {
  importKey: string
  file?: import('./schema').SpreadsheetFileDefinition
  sheet?: import('./schema').SpreadsheetSheetDefinition
  header?: import('./schema').SpreadsheetHeaderDefinition
  matching?: import('./schema').SpreadsheetMatchingDefinition
  context: TContextItems
  columns: TColumns
  references: TReferences
  resolutions: TResolutions
  relations: TRelations
  buildRow?: TBuildRow
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
  readonly SpreadsheetResolutionDefinition[],
  SchemaRelations<TSchema>,
  SchemaBuildRow<TSchema>
>
