import { createTableState } from '../core'
import type {
  TableApi,
  TableMeta,
  TableSchemaSource,
  TableLayout,
} from '../types'

type UsableTableSchema = {
  rowKey: unknown
  source: {
    mode: 'client' | 'remote'
  }
  defaultLayout?: TableLayout
  views?: readonly string[]
}

function resolveSchema<TSchema>(schema: TableSchemaSource<TSchema>): TSchema {
  if (typeof schema === 'function') {
    return (schema as () => TSchema)()
  }

  if (schema && typeof schema === 'object' && 'value' in schema) {
    return schema.value as TSchema
  }

  return schema
}

function createTableMeta<TSchema extends UsableTableSchema>(schema: TSchema): TableMeta<TSchema> {
  return {
    rowKey: schema.rowKey,
    mode: schema.source.mode,
    views: schema.views,
  } as TableMeta<TSchema>
}

export function useTable<TSchema extends UsableTableSchema>(
  schema: TableSchemaSource<TSchema>,
): TableApi<TSchema> {
  const resolvedSchema = resolveSchema(schema)
  const state = createTableState({
    layout: resolvedSchema.defaultLayout ?? 'table',
  })

  return {
    schema,
    state,
    runtime: {
      state,
      rows: [],
      rowCount: 0,
      isLoading: false,
      error: null,
    },
    meta: createTableMeta(resolvedSchema),
    resolveSchema: () => resolveSchema(schema),
    async refresh() {
      return {
        rows: [],
        rowCount: 0,
      }
    },
  }
}
