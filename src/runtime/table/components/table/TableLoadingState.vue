<script setup lang="ts">
import USkeleton from '@nuxt/ui/components/Skeleton.vue'
import { useElementSize } from '@vueuse/core'
import { computed, useTemplateRef } from 'vue'

import { isNumber } from '../../../shared/utils/predicate'
import { useDataListUi } from '../../composables/use-data-list-ui'
import { useTableInternals } from '../../composables/use-table-internals'
import type { DataListControlSize } from '../../types'
import { ROW_ACTIONS_COLUMN_ID, resolveDataListTableSize } from '../../utils'

const props = defineProps<{
  minHeight: string
  size?: DataListControlSize
}>()

const internals = useTableInternals()
const dataListUi = useDataListUi()
const rootRef = useTemplateRef<HTMLDivElement>('root')
const { height } = useElementSize(rootRef)
const tableSize = computed(() =>
  resolveDataListTableSize(
    props.size ?? dataListUi.ui.value.table?.size ?? dataListUi.controlSize.value,
  ),
)

const skeletonRows = computed(() => {
  const measuredHeight = height.value
  const fallbackHeight = tableSize.value.rowHeight * 8
  const availableHeight = measuredHeight > 0 ? measuredHeight : fallbackHeight
  const count = Math.max(1, Math.ceil(availableHeight / tableSize.value.rowHeight))
  return Array.from({ length: count }, (_, index) => index)
})

const skeletonColumns = computed(() => {
  const dataColumns = internals.tableColumns.visibleOrderedColumns.value.map((column, index) => {
    const isRowActions = column.id === ROW_ACTIONS_COLUMN_ID

    return {
      id: column.id,
      width: isRowActions
        ? '3.25rem'
        : resolveSkeletonColumnWidth({ columnId: column.id, columnIndex: index }),
      align: isRowActions || column.align === 'right' ? ('end' as const) : ('start' as const),
      kind: isRowActions ? ('action' as const) : ('text' as const),
      skeletonWidth: isRowActions
        ? '1rem'
        : index === 0
          ? 'min(10rem, 72%)'
          : index === 1
            ? 'min(12rem, 78%)'
            : index === 2
              ? 'min(8rem, 68%)'
              : index === 3
                ? 'min(9rem, 72%)'
                : 'min(7rem, 64%)',
    }
  })

  if (!internals.selection.selectionEnabled.value) return dataColumns

  return [
    {
      id: '__select',
      width: '3.5rem',
      align: 'start' as const,
      kind: 'checkbox' as const,
      skeletonWidth: '1rem',
    },
    ...dataColumns,
  ]
})

const skeletonGridTemplate = computed(() =>
  skeletonColumns.value.map((column) => column.width).join(' '),
)

function resolveSkeletonColumnWidth(options: { columnId: string; columnIndex: number }) {
  const column = internals.tableColumns.visibleOrderedColumns.value[options.columnIndex]
  const configuredSize = internals.tableColumns.tableState.value.columnSizing[options.columnId]
  if (configuredSize) return `${configuredSize}px`
  if (column?.width !== undefined) return resolveCssColumnSize(column.width)
  if (column?.minWidth !== undefined) return `minmax(${resolveCssColumnSize(column.minWidth)}, 1fr)`
  return 'minmax(120px, 1fr)'
}

function resolveCssColumnSize(size: number | string) {
  return isNumber(size) ? `${size}px` : size
}
</script>

<template>
  <div
    ref="root"
    data-table-loading-state
    class="h-full min-h-0 w-full overflow-hidden"
    :style="{ minHeight }"
  >
    <div
      v-for="rowIndex in skeletonRows"
      :key="rowIndex"
      data-table-loading-row
      class="grid w-full items-stretch border-b border-default/40"
      :style="{
        gridTemplateColumns: skeletonGridTemplate,
        minHeight: `${tableSize.rowHeight}px`,
      }"
    >
      <div
        v-for="column in skeletonColumns"
        :key="`${rowIndex}-${column.id}`"
        :class="[
          'flex min-w-0 items-center',
          tableSize.cell,
          column.align === 'end' ? 'justify-end' : 'justify-start',
        ]"
      >
        <USkeleton v-if="column.kind === 'checkbox'" class="size-4 rounded-md" />
        <USkeleton
          v-else
          class="h-3.5 max-w-full rounded-full"
          :style="{ width: column.skeletonWidth }"
        />
      </div>
    </div>
  </div>
</template>
