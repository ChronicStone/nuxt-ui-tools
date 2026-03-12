import type { TableSchema } from '../types/schema'
import type { TableSourceExecutionResult } from '../types/source'
import type { GenericObject } from '../types/utils'

export interface TableSourceExecutorPlaceholder<
  TSchema extends TableSchema = TableSchema,
  TRow extends GenericObject = GenericObject,
> {
  schema: TSchema
  execute: () => Promise<TableSourceExecutionResult<TRow>>
}

export function createTableSourceExecutor<
  TSchema extends TableSchema = TableSchema,
>(
  schema: TSchema,
): TableSourceExecutorPlaceholder<TSchema> {
  return {
    schema,
    async execute() {
      return {
        rows: [],
        rowCount: 0,
      }
    },
  }
}
