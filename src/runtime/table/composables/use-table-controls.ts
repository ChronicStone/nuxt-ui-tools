import { computed, ref, type ComputedRef } from 'vue'

import type { TableLayout, TableSchemaView } from '../types'
import type { useTableLayout } from './use-table-layout'

export interface UseTableControlsParams {
  schema: ComputedRef<TableSchemaView>
  layout: ReturnType<typeof useTableLayout>
}

export function useTableControls(options: UseTableControlsParams) {
  const columnsPanelOpen = ref<boolean>(false)
  const columnsPanelSearch = ref<string>('')

  const tableLayout = options.layout.activeLayout
  const gridEnabled = options.layout.gridEnabled
  const layoutState = computed(() => ({
    active: tableLayout.value,
    available: [
      ...(options.layout.tableEnabled.value ? ['table'] : []),
      ...(options.layout.gridEnabled.value ? ['grid'] : []),
    ] as TableLayout[],
  }))

  function setTableLayout(layout: TableLayout) {
    options.layout.activeLayout.value = layout
  }

  return {
    columnsPanelOpen,
    columnsPanelSearch,
    tableLayout,
    gridEnabled,
    layoutState,
    setTableLayout,
  }
}
