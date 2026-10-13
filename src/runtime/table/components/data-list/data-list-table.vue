<script setup lang="ts">
import { computed } from 'vue'

import { useDataListUi } from '../../composables/use-data-list-ui'
import { useTableInternals } from '../../composables/use-table-internals'
import type { DataListControlSize, DataListTableUi } from '../../types'
import SummaryRenderer from '../summary/summary-renderer.vue'
import TableRenderer from '../table/table-renderer.vue'

/**
 * The table layout. Summary rows are its compact presentation, so they share its states and slots.
 * The template carries no comment on purpose: in development a root comment turns the root into a
 * fragment, which a transition around this component cannot leave, so the next view never comes in.
 */
const props = defineProps<{
  height?: string
  size?: DataListControlSize
  fill?: boolean
  ui?: DataListTableUi
}>()
const internals = useTableInternals()
const dataListUi = useDataListUi()
const resolvedSize = computed(
  () => props.size ?? dataListUi.ui.value.table?.size ?? dataListUi.controlSize.value,
)
const summarySize = computed(
  () => props.size ?? dataListUi.ui.value.summary?.size ?? resolvedSize.value,
)
const resolvedUi = computed<DataListTableUi>(() => ({
  ...dataListUi.ui.value.table?.ui,
  ...props.ui,
}))
</script>

<template>
  <SummaryRenderer
    v-if="internals.rowSummary.active.value"
    :height="height"
    :size="summarySize"
    :fill="fill"
    :ui="dataListUi.ui.value.summary?.ui"
  >
    <template v-for="(_, name) in $slots" #[name]="scope">
      <slot :name="name" v-bind="scope ?? {}" />
    </template>
  </SummaryRenderer>
  <TableRenderer v-else :height="height" :size="resolvedSize" :fill="fill" :ui="resolvedUi">
    <template v-for="(_, name) in $slots" #[name]="scope">
      <slot :name="name" v-bind="scope ?? {}" />
    </template>
  </TableRenderer>
</template>
