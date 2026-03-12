import type { DataListComponentContract, DataListProps, TableSchema } from '../types'
import { provideTableInternals } from '../core/injection'

export function createDataListSetup<TSchema extends TableSchema>(
  props: DataListProps<TSchema>,
): DataListComponentContract<TSchema> {
  const table = props.table

  // DataList is the injection boundary — provides internals to all child components
  provideTableInternals({
    schema: table._schema,
    stateRefs: table.state,
    metaRefs: table.meta as any,
    effectiveFilters: table._effectiveFilters,
    refresh: table.api.refresh,
  })

  return {
    name: 'DataList',
    props: {
      table,
    },
    resolvedSchema: table._schema as unknown as TSchema,
  }
}
