import { computed, type ComputedRef } from 'vue'
import { createEnumCodec, queryRef } from 'vue-qs'

import type { TableSchemaView } from '../types'

interface UseTableLayoutParams {
  schema: ComputedRef<TableSchemaView>
}

export function useTableLayout({ schema }: UseTableLayoutParams) {
  //   const gridEnabled = useBreakpointValue(schema.value.grid?.enabled ?? !!schema.value.grid, 'boolean')
  //   const tableEnabled = useBreakpointValue(schema.value.table?.enabled ?? !!schema.value.table, 'boolean')

  const gridEnabled = computed(() => schema.value.grid?.enabled ?? !!schema.value.grid)
  const tableEnabled = computed(() => schema.value.table?.enabled ?? !!schema.value.table)

  const activeLayout = queryRef('l', {
    shouldOmitDefault: true,
    defaultValue: schema.value.defaultLayout,
    codec: createEnumCodec(['grid', 'table'] as const),
  })

  //   watch([gridEnabled, tableEnabled], ([grid, table]) => {
  //     if (!grid && activeLayout.value === 'grid') activeLayout.value = 'table'
  //     if (!table && activeLayout.value === 'table') activeLayout.value = 'grid'
  //     if (!grid && !table) activeLayout.value = defaultLayout ?? 'table'
  //   }, { immediate: true })

  return {
    activeLayout,
    gridEnabled,
    tableEnabled,
  }
}
