<script setup lang="ts">
import UTable from '@nuxt/ui/components/Table.vue'
import { computed, nextTick, ref, watch } from 'vue'

import { useDataListUi } from '../../composables/use-data-list-ui'
import { useTableInternals } from '../../composables/use-table-internals'
import type { DataListControlSize, DataListTableUi } from '../../types'
import { mergeDataListUiClass, resolveDataListTableSize } from '../../utils'
import { createDefaultColumnState, resolveTableRowId } from '../../utils'
import TableEmptyState from './TableEmptyState.vue'
import TableLoadingState from './TableLoadingState.vue'

const internals = useTableInternals()
const dataListUi = useDataListUi()
const props = defineProps<{
  height?: string
  size?: DataListControlSize
  externalScroll?: boolean
  ui?: DataListTableUi
}>()
const tableRef = ref<{ $el?: Element | null } | null>(null)

const tableRows = computed(() => internals.queryContent.data.value.rows)
const showInitialLoading = computed(
  () =>
    internals.queryContent.status.value.isBooting ||
    (internals.queryContent.status.value.isPending && tableRows.value.length === 0),
)
const showRefreshing = computed(
  () => tableRows.value.length > 0 && internals.queryContent.status.value.isFetching,
)
const tableEmpty = computed(() => !showInitialLoading.value && tableRows.value.length === 0)
const resolvedSize = computed(
  () => props.size ?? dataListUi.ui.value.table?.size ?? dataListUi.controlSize.value,
)
const tableSizeClasses = computed(() => resolveDataListTableSize(resolvedSize.value))
const bodyPlaceholderMinHeight = computed(() =>
  props.height ? `calc(${props.height} - ${tableSizeClasses.value.rowHeight}px)` : '24rem',
)
const bodyOverlayTop = computed(() => `${tableSizeClasses.value.rowHeight}px`)
const defaultColumnState = createDefaultColumnState()

function getVirtualRow(index: number) {
  return tableRows.value[index] ?? {}
}

watch(tableEmpty, (isEmpty) => {
  if (!isEmpty) return

  nextTick(() => {
    const element = tableRef.value?.$el
    if (!(element instanceof HTMLElement)) return
    element.scrollTo({ top: 0, left: 0 })
  })
})
</script>

<template>
  <div
    :class="
      mergeDataListUiClass(
        externalScroll ? 'relative min-h-full overflow-visible' : 'relative overflow-hidden',
        undefined,
        ui?.wrapper,
      )
    "
    :style="height ? { height } : undefined"
  >
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
      :get-row-id="
        (row, index) => resolveTableRowId({ rowKey: internals.schema.value.rowKey, row, index })
      "
      :sorting-options="{ manualSorting: true }"
      sticky="header"
      :loading="showRefreshing"
      loading-color="primary"
      loading-animation="carousel"
      :class="height ? 'h-full min-h-0' : undefined"
      :ui="{
        root: mergeDataListUiClass(
          externalScroll ? 'overflow-visible' : height ? 'h-full min-h-0 overflow-auto' : undefined,
          undefined,
          ui?.root,
        ),
        base: ui?.base,
        caption: ui?.caption,
        thead: mergeDataListUiClass(
          'group/table-head bg-default after:inset-x-0 after:bottom-0 after:w-full after:z-[12] after:pointer-events-none',
          undefined,
          ui?.thead,
        ),
        tbody: mergeDataListUiClass(
          'border-b border-default [&>tr]:hover:bg-elevated/50',
          undefined,
          ui?.tbody,
        ),
        tfoot: ui?.tfoot,
        tr: mergeDataListUiClass(
          `${tableSizeClasses.row} border-b border-default transition-colors last:border-b`,
          undefined,
          ui?.tr,
        ),
        th: mergeDataListUiClass(
          `${tableSizeClasses.header} [&[data-pinned=left]]:z-[11] [&[data-pinned=left]]:bg-default [&[data-pinned=right]]:z-[11] [&[data-pinned=right]]:bg-default`,
          undefined,
          ui?.th,
        ),
        td: mergeDataListUiClass(
          `${tableSizeClasses.cell} [&[data-pinned=left]]:bg-default [&[data-pinned=right]]:bg-default`,
          undefined,
          ui?.td,
        ),
        separator: ui?.separator,
        empty: ui?.empty,
        loading: ui?.loading,
      }"
      :virtualize="
        height
          ? {
              enabled: true,
              getItemKey: (index: number) =>
                resolveTableRowId({
                  rowKey: internals.schema.value.rowKey,
                  row: getVirtualRow(index),
                  index,
                }),
            }
          : false
      "
    >
      <template #empty>
        <template v-if="tableEmpty">
          <slot name="empty">
            <div />
          </slot>
        </template>
        <div v-else />
      </template>
    </UTable>

    <div
      v-if="showInitialLoading"
      :class="
        mergeDataListUiClass(
          'pointer-events-none absolute inset-x-0 bottom-0 z-10',
          undefined,
          ui?.loadingOverlay,
        )
      "
      :style="{ top: bodyOverlayTop }"
    >
      <TableLoadingState :min-height="bodyPlaceholderMinHeight" :size="resolvedSize" />
    </div>

    <div
      v-if="tableEmpty"
      :class="
        mergeDataListUiClass(
          'pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-center justify-center',
          undefined,
          ui?.emptyOverlay,
        )
      "
      :style="{ top: bodyOverlayTop }"
    >
      <TableEmptyState :min-height="bodyPlaceholderMinHeight" :size="resolvedSize" />
    </div>
  </div>
</template>
