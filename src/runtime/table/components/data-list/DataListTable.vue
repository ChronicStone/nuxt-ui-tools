<script setup lang="ts">
import { computed } from 'vue'

import { useDataListUi } from '../../composables/use-data-list-ui'
import type { DataListControlSize, DataListTableUi } from '../../types'
import TableRenderer from '../table/TableRenderer.vue'

const props = defineProps<{
  height?: string
  size?: DataListControlSize
  externalScroll?: boolean
  ui?: DataListTableUi
}>()
const dataListUi = useDataListUi()
const resolvedSize = computed(
  () => props.size ?? dataListUi.ui.value.table?.size ?? dataListUi.controlSize.value,
)
const resolvedUi = computed<DataListTableUi>(() => ({
  ...dataListUi.ui.value.table?.ui,
  ...props.ui,
}))
</script>

<template>
  <TableRenderer
    :height="height"
    :size="resolvedSize"
    :external-scroll="externalScroll"
    :ui="resolvedUi"
  >
    <template v-for="(_, name) in $slots" #[name]="scope">
      <slot :name="name" v-bind="scope ?? {}" />
    </template>
  </TableRenderer>
</template>
