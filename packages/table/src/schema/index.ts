import { resolveColumns, resolveUiFilters } from '../builders'
import type {
  BuildTableSchema,
  InferTableSourceRow,
  ResolvedTableSchema,
  TableContextDataFromItems,
  TableContextItem,
  TableKnownFieldPath,
  TablePageContextItem,
  TableSource,
} from '../types'

export function defineTableSchema<
  const TSource extends TableSource<any, any, any> = TableSource<any, any, any>,
  TContextItems extends TableContextItem[] = TableContextItem[],
  TPageContextItems extends TablePageContextItem<
    InferTableSourceRow<TSource>,
    TableContextDataFromItems<TContextItems>
  >[] = TablePageContextItem<
    InferTableSourceRow<TSource>,
    TableContextDataFromItems<TContextItems>
  >[],
>(
  schema: BuildTableSchema<
    TSource,
    TContextItems,
    TPageContextItems,
    TableKnownFieldPath<InferTableSourceRow<TSource>>,
    TableKnownFieldPath<InferTableSourceRow<TSource>>
  >,
): ResolvedTableSchema<
  BuildTableSchema<
    TSource,
    TContextItems,
    TPageContextItems,
    TableKnownFieldPath<InferTableSourceRow<TSource>>,
    TableKnownFieldPath<InferTableSourceRow<TSource>>
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
    BuildTableSchema<
      TSource,
      TContextItems,
      TPageContextItems,
      TableKnownFieldPath<InferTableSourceRow<TSource>>,
      TableKnownFieldPath<InferTableSourceRow<TSource>>
    >
  >
}
