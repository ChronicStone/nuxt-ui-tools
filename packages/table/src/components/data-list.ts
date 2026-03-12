import { useTable } from '@lib/composables'
import type {
  DataListComponentContract,
  DataListProps,
  TableSchema,
} from '@lib/types'

export function createDataListComponent<TSchema extends TableSchema>(
  props: DataListProps<TSchema>,
): DataListComponentContract<TSchema> {
  const table = props.table ?? (props.schema ? useTable(props.schema) : undefined)
  const resolvedSchema = table?.resolveSchema()

  return {
    name: 'DataList',
    props: {
      schema: props.schema,
      table,
    },
    resolvedSchema,
  }
}
