<script setup lang="ts">
/**
 * One body row. As a component it is patched by key and re-renders only when its own props change,
 * so rows that stay on screen while the virtual window slides keep their cells untouched.
 */
import type { HTMLAttributes } from 'vue'

import type { GenericObject } from '../../types'
import TableCell from './table-cell'
import type { tableRowCells } from './table-layout'

defineProps<{
  rowId: string
  original: GenericObject
  index: number
  cells: ReturnType<typeof tableRowCells>
  selected: boolean
  appended: boolean
  rowClass?: HTMLAttributes['class']
}>()
</script>

<template>
  <tr
    class="nut-dl-row group/row"
    :class="[
      selected ? 'nut-dl-row--selected' : '',
      appended ? 'nut-dl-row--appended' : '',
      rowClass,
    ]"
    :data-index="index"
    :data-row-id="rowId"
  >
    <template v-for="slot in cells" :key="slot.key">
      <td v-if="slot.kind === 'fill'" class="nut-dl-table__fill p-0" aria-hidden="true" />
      <td
        v-else-if="slot.kind === 'spacer'"
        :colspan="slot.colSpan"
        class="nut-dl-table__spacer p-0"
        aria-hidden="true"
      />
      <td
        v-else-if="slot.layout"
        class="nut-dl-td h-[var(--nut-dl-row-h)] py-0 align-middle"
        :class="slot.layout.class"
        :data-col="slot.columnId"
        :style="slot.layout.style"
      >
        <div class="nut-dl-td__inner min-w-0" :class="slot.layout.innerClass">
          <TableCell
            v-if="slot.layout.render"
            :index="index"
            :render="slot.layout.render"
            :row="original"
          />
        </div>
      </td>
    </template>
  </tr>
</template>
