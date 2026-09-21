<script setup lang="ts">
import { computed } from 'vue'

import { useDashboardUi } from '../../composables/use-dashboard-ui'
import type { DashboardDataTable } from '../../types'
import { DASHBOARD_TABLE_CLASSES, resolveDashboardClasses } from '../../utils/ui'

const props = defineProps<{
  table: DashboardDataTable
  /** Caps the height and scrolls under a sticky header. */
  scroll?: boolean
}>()

const appUi = useDashboardUi()
const classes = computed(() => resolveDashboardClasses(DASHBOARD_TABLE_CLASSES, appUi.value.table))
</script>

<template>
  <div :class="[classes.wrapper, scroll && 'max-h-80']" data-table-view>
    <table :class="classes.table">
      <thead :class="classes.head">
        <tr>
          <th
            v-for="column in props.table.columns"
            :key="column.key"
            scope="col"
            :class="[classes.th, column.numeric ? 'text-end' : 'text-start']"
          >
            {{ column.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, rowIndex) in props.table.rows" :key="rowIndex" :class="classes.row">
          <component
            :is="index === 0 ? 'th' : 'td'"
            v-for="(cell, index) in row"
            :key="index"
            :scope="index === 0 ? 'row' : undefined"
            :class="[
              classes.td,
              props.table.columns[index]?.numeric ? 'text-end tabular-nums' : 'text-start',
              index === 0 && 'font-medium text-default',
            ]"
          >
            {{ cell.text }}
          </component>
        </tr>
      </tbody>
    </table>
  </div>
</template>
