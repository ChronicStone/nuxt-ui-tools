import { computed, toValue } from 'vue'
import type { ComputedRef, MaybeRefOrGetter } from 'vue'

import type { TableApi, TableSchemaView } from '../types'
import { useProvideTableInternals } from './use-table-internals'

export function useTable<TSchema = TableSchemaView>(
  schema: MaybeRefOrGetter<TSchema>,
): TableApi<TSchema> & { schema: ComputedRef<TSchema> } {
  const resolvedSchema = computed<TSchema>(() => toValue(schema))
  const internals = useProvideTableInternals({
    rawSchema: computed(() => resolvedSchema.value as unknown as TableSchemaView),
  })

  return {
    ...internals.tableApi,
    schema: resolvedSchema,
  } as TableApi<TSchema> & { schema: ComputedRef<TSchema> }
}
