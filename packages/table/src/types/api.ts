import type { GenericObject } from './utils'
import type { TableSourceExecutionResult } from './source'
import type { TableRuntimeState, TableState } from './state'
import type {
  ExtractTableContextData,
  ExtractTablePageContextData,
  ExtractTableRow,
  TableSchemaSource,
} from './utils'

export interface TableMeta<TSchema> {
  rowKey: TSchema extends { rowKey: infer TRowKey } ? TRowKey : never
  mode: TSchema extends { source: { mode: infer TMode } } ? TMode : never
  views: TSchema extends { views?: infer TViews } ? TViews : never
}

export interface TableApi<TSchema> {
  schema: TableSchemaSource<TSchema>
  state: TableState
  runtime: TableRuntimeState<ExtractTableRow<TSchema>>
  meta: TableMeta<TSchema>
  resolveSchema: () => TSchema
  refresh: () => Promise<TableSourceExecutionResult<ExtractTableRow<TSchema>>>
}

export interface TableRowApi<TSchema> {
  row: ExtractTableRow<TSchema>
  context: ExtractTableContextData<TSchema>
  pageContext: ExtractTablePageContextData<TSchema>
}

export type AnyTableApi = TableApi<{
  rowKey: string
  source: { mode: 'client' | 'remote' }
}> & {
  runtime: TableRuntimeState<GenericObject>
  state: TableState
}
