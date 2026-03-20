import { computed, toValue } from 'vue'
import type { ComputedRef, MaybeRefOrGetter } from 'vue'

import type { TableApi } from '../types'
import { createTableInternals, type TableInternals } from './use-table-internals'

export function useTable<TSchema>(
  schema: MaybeRefOrGetter<TSchema>,
): TableApi<TSchema> & { schema: ComputedRef<TSchema>; __internals: TableInternals } {
  const resolvedSchema = computed<TSchema>(() => toValue(schema))
  const internals = createTableInternals({
    rawSchema: resolvedSchema,
  })

  return {
    ...internals.tableApi,
    schema: resolvedSchema,
    __internals: internals,
  }
}
