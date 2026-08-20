import { resolveColumns, resolveUiFilters } from '../builders'
import type {
  BuildTableSchema,
  GenericObject,
  InferTableSourceRow,
  ResolvedTableSchema,
  TableContextDataFromItems,
  TableContextItem,
  TableKnownFieldPath,
  TableColumnCollection,
  TablePageContextItem,
  TablePaginationSchema,
  TableSource,
} from '../types'

type InferredTableSchema<
  TSource extends TableSource<any, any, any>,
  TContextItems extends TableContextItem[],
  TPageContextItems extends TablePageContextItem<
    InferTableSourceRow<TSource>,
    TableContextDataFromItems<TContextItems>
  >[],
> = BuildTableSchema<
  TSource,
  TContextItems,
  TPageContextItems,
  TableKnownFieldPath<InferTableSourceRow<TSource>>,
  TableKnownFieldPath<InferTableSourceRow<TSource>>
>

type PaginationSourceConstraint<TPagination> = TPagination extends { mode: 'cursor' }
  ? { source: { mode: 'remote' } }
  : object

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
  const TPagination extends TablePaginationSchema | undefined = undefined,
>(
  schema: InferredTableSchema<TSource, TContextItems, TPageContextItems> & {
    pagination?: TPagination
  } & PaginationSourceConstraint<TPagination>,
): ResolvedTableSchema<InferredTableSchema<TSource, TContextItems, TPageContextItems>> & {
  pagination: TPagination
} {
  // SAFETY: schema transformation preserves every input field while resolving only column/filter collections.
  return {
    ...schema,
    table: schema.table
      ? {
          ...schema.table,
          // SAFETY: the schema's inferred row/context contracts are preserved by the final schema return contract.
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
          ui: resolveUiFilters(schema.filters.ui),
        }
      : undefined,
  } as ResolvedTableSchema<InferredTableSchema<TSource, TContextItems, TPageContextItems>> & {
    pagination: TPagination
  }
}
