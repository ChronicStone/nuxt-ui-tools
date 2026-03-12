import { resolveColumns, resolveUiFilters } from '@lib/core/builders'
import type {
  InferTableSourceRow,
  InferTableSourceFilterKey,
  InferTableSourceSortKey,
  TableKnownFieldPath,
  ResolvedTableSchema,
  TableContextDataFromItems,
  TableContextItem,
  TablePageContextItem,
  TableSchemaInput,
  TableSource,
} from '@lib/types'

type ResolveSchemaKey<TCandidate extends string, TFallback extends string> =
  [TCandidate] extends [never]
    ? TFallback
    : string extends TCandidate
      ? TFallback
      : TCandidate

export function defineTableSchema<
  const TSource extends TableSource<any, any, any> = TableSource<any, any, any>,
  const TContextItems extends readonly TableContextItem[] = readonly TableContextItem[],
  const TPageContextItems extends readonly TablePageContextItem<
    InferTableSourceRow<TSource>,
    TableContextDataFromItems<TContextItems>
  >[] = readonly TablePageContextItem<
    InferTableSourceRow<TSource>,
    TableContextDataFromItems<TContextItems>
  >[],
  const TView extends string = string,
>(
  schema: TableSchemaInput<
    TSource,
    InferTableSourceFilterKey<TSource> extends never
      ? TableKnownFieldPath<InferTableSourceRow<TSource>>
      : InferTableSourceFilterKey<TSource>,
    ResolveSchemaKey<
      InferTableSourceSortKey<TSource>,
      TableKnownFieldPath<InferTableSourceRow<TSource>>
    >,
    TContextItems,
    TPageContextItems,
    TView
  >,
): ResolvedTableSchema<
  TableSchemaInput<
    TSource,
    InferTableSourceFilterKey<TSource> extends never
      ? TableKnownFieldPath<InferTableSourceRow<TSource>>
      : InferTableSourceFilterKey<TSource>,
    ResolveSchemaKey<
      InferTableSourceSortKey<TSource>,
      TableKnownFieldPath<InferTableSourceRow<TSource>>
    >,
    TContextItems,
    TPageContextItems,
    TView
  >
> {
  return {
    ...schema,
    table: schema.table
      ? {
          ...schema.table,
          columns: resolveColumns(schema.table.columns as never),
        }
      : undefined,
    filters: schema.filters
      ? {
          ...schema.filters,
          ui: resolveUiFilters(schema.filters.ui),
        }
      : undefined,
  } as ResolvedTableSchema<
    TableSchemaInput<
      TSource,
      InferTableSourceFilterKey<TSource> extends never
        ? TableKnownFieldPath<InferTableSourceRow<TSource>>
        : InferTableSourceFilterKey<TSource>,
      ResolveSchemaKey<
        InferTableSourceSortKey<TSource>,
        TableKnownFieldPath<InferTableSourceRow<TSource>>
      >,
      TContextItems,
      TPageContextItems,
      TView
    >
  >
}
