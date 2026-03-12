import { resolveColumns, resolveUiFilters } from '../builders'
import type {
  BuildTableSchema,
  GenericObject,
  InferTableSourceRow,
  ResolvedTableSchema,
  TableColumnCollection,
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
          columns: resolveColumns(
            schema.table.columns as TableColumnCollection<
              GenericObject,
              GenericObject,
              GenericObject,
              string,
              string
            >,
          ),
        }
      : undefined,
    filters: schema.filters
      ? {
          ...schema.filters,
          ui: resolveUiFilters<
            InferTableSourceRow<TSource>,
            TableContextDataFromItems<TContextItems>,
            TableKnownFieldPath<InferTableSourceRow<TSource>>
          >(schema.filters.ui),
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
