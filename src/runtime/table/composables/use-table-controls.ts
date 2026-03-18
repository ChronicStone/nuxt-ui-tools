import { computed, ref, type ComputedRef } from 'vue'

import type { TableLayout, TableSchemaView } from '../types'

export interface UseTableControlsParams {
  schema: ComputedRef<TableSchemaView>
  activeLayout: ComputedRef<TableLayout>
}

export function useTableControls(options: UseTableControlsParams) {
  const columnsPanelOpen = ref<boolean>(false)
  const columnsPanelSearch = ref<string>('')

  const tableLayout = computed(() => options.activeLayout.value)
  const gridEnabled = computed(
    () => options.schema.value.grid?.enabled ?? !!options.schema.value.grid,
  )

  return {
    columnsPanelOpen,
    columnsPanelSearch,
    tableLayout,
    gridEnabled,
  }
}
