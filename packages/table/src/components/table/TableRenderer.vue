<script setup lang="ts">
import UTable from '@nuxt/ui/components/Table.vue'
import { computed, nextTick, ref, watch } from 'vue'

import { useTableInternals } from '../../composables/use-table-internals'
import { createDefaultColumnState } from '../../utils'
import TableEmptyState from './TableEmptyState.vue'
import TableLoadingState from './TableLoadingState.vue'

const internals = useTableInternals()
const props = defineProps<{
  height: string
}>()
const tableRef = ref<{ $el?: Element | null } | null>(null)

const tableRows = computed(() => internals.rows.value)
const tableLoading = computed(() => internals.queryContent.status.value.isPending)
const tableEmpty = computed(() => !tableLoading.value && tableRows.value.length === 0)
const bodyPlaceholderMinHeight = computed(() => `calc(${props.height} - 7rem)`)
const bodyOverlayTop = '2.625rem'
const defaultColumnState = createDefaultColumnState()

watch(tableEmpty, (isEmpty) => {
  if (!isEmpty) {
    return
  }

  nextTick(() => {
    const element = tableRef.value?.$el

    if (!(element instanceof HTMLElement)) {
      return
    }

    element.scrollTo({ top: 0, left: 0 })
  })
})
</script>

<template>
  <div class="relative overflow-hidden" :style="{ height }">
    <UTable
      ref="tableRef"
      :data="tableRows"
      :columns="internals.tableColumns.tableColumns.value"
      :column-order="internals.tableColumns.tableState.value.columnOrder"
      :column-visibility="internals.tableColumns.tableState.value.columnVisibility"
      :column-pinning="internals.tableColumns.tableState.value.columnPinning"
      :column-sizing="internals.tableColumns.tableState.value.columnSizing"
      :column-sizing-info="internals.tableColumns.tableState.value.columnSizingInfo"
      :column-sizing-options="{ enableColumnResizing: true, columnResizeMode: 'onChange' }"
      :row-selection="internals.selection.rowSelection.value"
      @update:column-order="internals.tableColumns.tableState.value.columnOrder = $event ?? []"
      @update:column-visibility="
        internals.tableColumns.tableState.value.columnVisibility = $event ?? {}
      "
      @update:column-pinning="
        internals.tableColumns.tableState.value.columnPinning =
          $event ?? defaultColumnState.columnPinning
      "
      @update:column-sizing="internals.tableColumns.tableState.value.columnSizing = $event ?? {}"
      @update:column-sizing-info="
        internals.tableColumns.tableState.value.columnSizingInfo =
          $event ?? defaultColumnState.columnSizingInfo
      "
      @update:row-selection="internals.selection.setRowSelection({ selection: $event ?? {} })"
      :get-row-id="(row: any) => String(row?.__$rowId ?? row?.id ?? '')"
      :sorting-options="{ manualSorting: true }"
      sticky="header"
      :loading="tableLoading"
      class="h-full"
      :ui="{
        root: tableEmpty
          ? 'h-full overflow-hidden bg-transparent'
          : 'h-full overflow-auto bg-transparent [scrollbar-gutter:stable]',
        base: 'min-w-full border-separate border-spacing-0 bg-transparent text-sm',
        thead: 'border-b border-default/30 bg-default/95',
        tbody: 'bg-transparent',
        tr: 'group',
        th: 'h-8 border-b-0 bg-default pl-3 pr-0 py-1.5 text-left align-middle text-sm font-medium text-default',
        td: 'h-12 border-b px-3 align-middle text-sm text-toned transition-colors duration-100 group-hover:bg-elevated/70 group-data-[selected=true]:!bg-elevated/70 group-data-[selected=true]:text-default',
        loading: 'p-0 align-top bg-transparent',
        empty: 'p-0 text-sm text-muted',
      }"
    >
      <template #loading>
        <TableLoadingState :min-height="bodyPlaceholderMinHeight" />
      </template>

      <template #empty>
        <slot name="empty">
          <div />
        </slot>
      </template>
    </UTable>

    <div
      v-if="tableEmpty"
      class="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-center justify-center"
      :style="{ top: bodyOverlayTop }"
    >
      <TableEmptyState :min-height="bodyPlaceholderMinHeight" />
    </div>
  </div>
</template>

<style scoped>
:deep([data-slot='root']) {
  scrollbar-width: thin;
  scrollbar-color: color-mix(in oklab, var(--ui-border) 82%, transparent) transparent;
}

:deep([data-slot='root']:hover) {
  scrollbar-color: color-mix(in oklab, var(--ui-border-accented) 92%, transparent) transparent;
}

:deep([data-slot='root']::-webkit-scrollbar) {
  width: 10px;
  height: 10px;
}

:deep([data-slot='root']::-webkit-scrollbar-track) {
  background: transparent;
}

:deep([data-slot='root']::-webkit-scrollbar-thumb) {
  border: 2px solid transparent;
  border-radius: 999px;
  background: color-mix(in oklab, var(--ui-border) 86%, transparent);
  background-clip: padding-box;
}

:deep([data-slot='root']:hover::-webkit-scrollbar-thumb) {
  background: color-mix(in oklab, var(--ui-border-accented) 80%, transparent);
  background-clip: padding-box;
}

:deep([data-slot='root']::-webkit-scrollbar-thumb:hover) {
  background: color-mix(in oklab, var(--ui-border-accented) 95%, transparent);
  background-clip: padding-box;
}

:deep([data-slot='root']::-webkit-scrollbar-corner) {
  background: transparent;
}

:deep(th[data-pinned]) {
  background-color: color-mix(in oklab, var(--ui-bg) 76%, transparent) !important;
  background-image: none !important;
  backdrop-filter: blur(6px) saturate(120%);
}

:deep(td[data-pinned]) {
  background-color: color-mix(in oklab, var(--ui-bg) 88%, transparent) !important;
  background-image: none !important;
  backdrop-filter: none;
}

:deep(tr[data-selected='true'] td[data-pinned]) {
  background-color: color-mix(in oklab, var(--ui-bg-elevated) 90%, transparent) !important;
  color: var(--ui-text) !important;
}

:deep(tbody td) {
  border-bottom-color: color-mix(in oklab, var(--ui-border) 14%, transparent) !important;
}
</style>
