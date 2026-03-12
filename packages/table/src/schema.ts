import { resolveColumns } from '@nuxt-ui-tools/table-core'

import { resolveUiFilters } from './builders'
import type {
  BuildTableSchemaInput,
  InferTableSourceRow,
  ResolvedTableSchema,
  TableContextDataFromItems,
  TableContextItem,
  TableKnownFieldPath,
  TablePageContextItem,
  TableSource,
} from './types'

export function defineTable<
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
  schema: BuildTableSchemaInput<TSource, TContextItems, TPageContextItems, TView>,
): ResolvedTableSchema<BuildTableSchemaInput<TSource, TContextItems, TPageContextItems, TView>> {
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
  } as ResolvedTableSchema<BuildTableSchemaInput<TSource, TContextItems, TPageContextItems, TView>>
}
