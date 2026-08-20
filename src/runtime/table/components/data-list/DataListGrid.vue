<script setup lang="ts">
import { computed } from 'vue'

import { useDataListUi } from '../../composables/use-data-list-ui'
import type { DataListControlSize, DataListGridUi } from '../../types'
import GridRenderer from '../grid/GridRenderer.vue'

const props = defineProps<{ height?: string; size?: DataListControlSize; ui?: DataListGridUi }>()
const dataListUi = useDataListUi()
const resolvedSize = computed(
  () => props.size ?? dataListUi.ui.value.grid?.size ?? dataListUi.controlSize.value,
)
const resolvedUi = computed<DataListGridUi>(() => ({
  ...dataListUi.ui.value.grid?.ui,
  ...props.ui,
}))
</script>

<template>
  <GridRenderer :height="height" :size="resolvedSize" :ui="resolvedUi">
    <template v-for="(_, name) in $slots" #[name]="scope">
      <slot :name="name" v-bind="scope ?? {}" />
    </template>
  </GridRenderer>
</template>
