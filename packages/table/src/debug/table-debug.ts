import type { TableApi } from '../types/api'

export interface TableDebugSnapshot<
  TSchema = unknown,
  TTable extends TableApi<TSchema> = TableApi<TSchema>,
> {
  schema: TSchema
  state: TTable['state']
  meta: TTable['meta']
}

export function createTableDebugSnapshot<TSchema, TTable extends TableApi<TSchema>>(
  table: TTable,
): TableDebugSnapshot<TSchema, TTable> {
  return {
    schema: table.resolveSchema(),
    state: table.state,
    meta: table.meta,
  }
}
