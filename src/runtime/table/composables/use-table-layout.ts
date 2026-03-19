import { computed, type ComputedRef } from 'vue'

import { useQueryState, createEnumCodec } from '#query-state'

import type { TableSchemaView } from '../types'

interface UseTableLayoutParams {
  schema: ComputedRef<TableSchemaView>
}

export function useTableLayout({ schema }: UseTableLayoutParams) {
  const gridEnabled = computed(() => schema.value.grid?.enabled ?? !!schema.value.grid)
  const tableEnabled = computed(() => schema.value.table?.enabled ?? !!schema.value.table)

  const activeLayout = useQueryState({
    key: 'l',
    codec: createEnumCodec(['grid', 'table'] as const),
    defaultValue: schema.value.defaultLayout ?? 'table',
    omitDefault: true,
  })

  return {
    activeLayout,
    gridEnabled,
    tableEnabled,
  }
}
