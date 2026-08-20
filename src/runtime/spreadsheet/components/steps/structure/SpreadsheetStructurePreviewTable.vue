<script setup lang="ts">
import { useVirtualizer } from '@tanstack/vue-virtual'
import { computed, ref } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import type { SpreadsheetValue } from '../../../types'

const props = defineProps<{
  rows: Array<{
    absoluteIndex: number
    cells: readonly unknown[]
  }>
  columnCount: number
  selectedHeaderRowIndex: number
}>()
const { t } = useUiToolsLocale()

const emit = defineEmits<{
  selectHeader: [rowIndex: number]
}>()

const viewportRef = ref<HTMLElement | null>(null)
const rowVirtualizer = useVirtualizer(
  computed(() => ({
    count: props.rows.length,
    getScrollElement: () => viewportRef.value,
    estimateSize: () => 38,
    overscan: 12,
    getItemKey: (index: number) => props.rows[index]?.absoluteIndex ?? index,
  })),
)
const virtualRows = computed(() => rowVirtualizer.value.getVirtualItems())
const totalSize = computed(() => rowVirtualizer.value.getTotalSize())

function formatHeaderCell(cell: SpreadsheetValue) {
  return String(cell ?? '').trim()
}

function getStatusCellTone(value: SpreadsheetValue) {
  return String(value ?? '').toLowerCase() === 'fail' ? 'text-error' : 'text-toned'
}
</script>

<template>
  <div class="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3">
    <div class="flex items-center justify-between gap-3">
      <h3 class="text-[13px] font-semibold text-highlighted">
        {{ t('spreadsheet.steps.structure.previewTitle') }} —
        {{
          t('spreadsheet.steps.structure.headerDetectedAtRow', { row: selectedHeaderRowIndex + 1 })
        }}
      </h3>

      <div
        class="inline-flex items-center gap-1.5 bg-info/10 px-2.5 py-1 font-mono text-[11px] font-medium text-info"
      >
        <span class="size-1.5 rounded-full bg-info" />
        <span>{{ t('spreadsheet.steps.structure.autoDetected') }}</span>
      </div>
    </div>

    <div
      ref="viewportRef"
      class="min-h-[26rem] max-h-[calc(100dvh-18rem)] overflow-auto border border-default/70 bg-default"
    >
      <div class="relative min-w-max" :style="{ height: `${totalSize}px` }">
        <div
          v-for="virtualRow in virtualRows"
          :key="String(virtualRow.key)"
          class="absolute left-0 top-0 min-w-max"
          :style="{ transform: `translateY(${virtualRow.start}px)` }"
        >
          <div
            v-if="rows[virtualRow.index]"
            class="flex cursor-pointer border-b border-default/50 last:border-b-0"
            :class="
              rows[virtualRow.index]!.absoluteIndex === selectedHeaderRowIndex
                ? 'bg-default'
                : rows[virtualRow.index]!.absoluteIndex < selectedHeaderRowIndex
                  ? 'bg-elevated/20'
                  : ''
            "
            @click="emit('selectHeader', rows[virtualRow.index]!.absoluteIndex)"
          >
            <div
              class="w-12 min-w-12 px-3 py-2 align-middle font-mono text-[11px]"
              :class="
                rows[virtualRow.index]!.absoluteIndex === selectedHeaderRowIndex
                  ? 'border-y border-l-[3px] border-inverted font-semibold text-highlighted'
                  : 'text-muted'
              "
            >
              {{ rows[virtualRow.index]!.absoluteIndex + 1 }}
            </div>

            <div
              v-for="columnIndex in columnCount"
              :key="`${rows[virtualRow.index]!.absoluteIndex}:${columnIndex}`"
              class="min-w-24 max-w-40 truncate px-3 py-2 font-mono text-[11px]"
              :class="
                rows[virtualRow.index]!.absoluteIndex === selectedHeaderRowIndex
                  ? 'border-y border-inverted font-semibold text-highlighted'
                  : columnIndex === columnCount
                    ? getStatusCellTone(rows[virtualRow.index]!.cells[columnIndex - 1])
                    : rows[virtualRow.index]!.absoluteIndex < selectedHeaderRowIndex
                      ? 'text-muted'
                      : 'text-toned'
              "
            >
              {{
                rows[virtualRow.index]!.absoluteIndex === selectedHeaderRowIndex
                  ? formatHeaderCell(rows[virtualRow.index]!.cells[columnIndex - 1])
                  : String(rows[virtualRow.index]!.cells[columnIndex - 1] ?? '')
              }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
