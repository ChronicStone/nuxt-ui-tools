<script setup lang="ts">
import { computed } from 'vue'

import { useDataListUi } from '../../composables/use-data-list-ui'
import type { DataListTableUi } from '../../types'
import TableRenderer from '../table/TableRenderer.vue'

const props = defineProps<{ height?: string; ui?: DataListTableUi }>()
const dataListUi = useDataListUi()
const resolvedUi = computed<DataListTableUi>(() => ({
  ...dataListUi.ui.value.table?.ui,
  ...props.ui,
}))
</script>

<template>
  <TableRenderer :height="height" :ui="resolvedUi">
    <template v-for="(_, name) in $slots" #[name]="scope">
      <slot :name="name" v-bind="scope ?? {}" />
    </template>
  </TableRenderer>
</template>
