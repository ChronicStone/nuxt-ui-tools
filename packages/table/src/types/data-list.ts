import type { AnyTableInstance, TableInstance } from './api'
import type { TableSchema } from './schema'

export interface DataListProps<TSchema extends TableSchema> {
  table: TableInstance<any, any, any, any, any, any>
}

export interface DataListComponentContract<TSchema extends TableSchema> {
  name: 'DataList'
  props: {
    table: AnyTableInstance
  }
  resolvedSchema?: TSchema
}
