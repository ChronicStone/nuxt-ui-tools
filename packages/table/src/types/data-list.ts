import type { TableApi } from './api'
import type { TableSchemaSource } from './utils'

export interface DataListProps<TSchema> {
  schema?: TableSchemaSource<TSchema>
  table?: TableApi<TSchema>
}

export interface DataListComponentContract<TSchema> {
  name: 'DataList'
  props: {
    schema?: TableSchemaSource<TSchema>
    table?: TableApi<TSchema>
  }
  resolvedSchema?: TSchema
}
