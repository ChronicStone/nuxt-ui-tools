<script setup lang="ts">
const props = defineProps<{
  rows: Array<{
    absoluteIndex: number
    cells: readonly unknown[]
  }>
  columnCount: number
  selectedHeaderRowIndex: number
}>()

const emit = defineEmits<{
  selectHeader: [rowIndex: number]
}>()

function formatHeaderCell(cell: unknown) {
  return String(cell ?? '').trim()
}

function getStatusCellTone(value: unknown) {
  return String(value ?? '').toLowerCase() === 'fail'
    ? 'text-error'
    : 'text-toned'
}
</script>

<template>
  <div class="grid gap-3">
    <div class="flex items-center justify-between gap-3">
      <h3 class="text-[13px] font-semibold text-highlighted">
        Sheet preview — header detected at row {{ selectedHeaderRowIndex + 1 }}
      </h3>

      <div class="inline-flex items-center gap-1.5 bg-info/10 px-2.5 py-1 font-mono text-[11px] font-medium text-info">
        <span class="size-1.5 rounded-full bg-info" />
        <span>Auto-detected</span>
      </div>
    </div>

    <div class="max-h-[22rem] overflow-auto border border-default/70 bg-default">
      <table class="min-w-max border-collapse">
        <tbody>
          <tr
            v-for="row in rows"
            :key="row.absoluteIndex"
            class="cursor-pointer border-b border-default/50 last:border-b-0"
            :class="row.absoluteIndex === selectedHeaderRowIndex ? 'bg-default' : row.absoluteIndex < selectedHeaderRowIndex ? 'bg-elevated/20' : ''"
            @click="emit('selectHeader', row.absoluteIndex)"
          >
            <td
              class="w-12 min-w-12 px-3 py-2 align-middle font-mono text-[11px]"
              :class="row.absoluteIndex === selectedHeaderRowIndex
                ? 'border-y border-l-[3px] border-inverted font-semibold text-highlighted'
                : 'text-muted'"
            >
              {{ row.absoluteIndex + 1 }}
            </td>

            <td
              v-for="columnIndex in columnCount"
              :key="`${row.absoluteIndex}:${columnIndex}`"
              class="min-w-24 max-w-40 truncate px-3 py-2 font-mono text-[11px]"
              :class="row.absoluteIndex === selectedHeaderRowIndex
                ? 'border-y border-inverted font-semibold text-highlighted'
                : columnIndex === columnCount
                  ? getStatusCellTone(row.cells[columnIndex - 1])
                  : row.absoluteIndex < selectedHeaderRowIndex
                    ? 'text-muted'
                    : 'text-toned'"
            >
              {{ row.absoluteIndex === selectedHeaderRowIndex
                ? formatHeaderCell(row.cells[columnIndex - 1])
                : String(row.cells[columnIndex - 1] ?? '') }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
