import { computed, watch, type ComputedRef } from 'vue'

import { useQueryState, createEnumCodec } from '#ui-tools/query-state'
import { useResponsiveValue } from '#ui-tools/shared'

import type { TableSchemaView } from '../types'

interface UseTableLayoutParams {
  schema: ComputedRef<TableSchemaView>
}

export function useTableLayout({ schema }: UseTableLayoutParams) {
  const defaultLayout = computed(() => schema.value.defaultLayout ?? 'table')
  const gridEnabled = useResponsiveValue(
    () => schema.value.grid?.enabled ?? Boolean(schema.value.grid),
  )
  const tableEnabled = useResponsiveValue(
    () => schema.value.table?.enabled ?? Boolean(schema.value.table),
  )

  const activeLayout = useQueryState({
    key: 'l',
    codec: createEnumCodec(['grid', 'table'] as const),
    defaultValue: defaultLayout.value,
    omitDefault: true,
  })

  watch(
    [gridEnabled, tableEnabled, defaultLayout],
    ([grid, table, fallbackLayout]) => {
      if (!grid && activeLayout.value === 'grid') activeLayout.value = 'table'
      if (!table && activeLayout.value === 'table') activeLayout.value = 'grid'
      if (!grid && !table) activeLayout.value = fallbackLayout
    },
    { immediate: true },
  )
  return {
    activeLayout,
    gridEnabled,
    tableEnabled,
  }
}
