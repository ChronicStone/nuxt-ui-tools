import { computed, ref } from 'vue'

export function useTableControls(options: {
  schema: any
  activeLayout: any
}) {
  const columnsPanelOpen = ref(false)
  const columnsPanelSearch = ref('')

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
