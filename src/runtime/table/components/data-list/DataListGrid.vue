<script setup lang="ts">
import { computed } from 'vue'

import { useDataListUi } from '../../composables/use-data-list-ui'
import type { DataListGridUi } from '../../types'
import GridRenderer from '../grid/GridRenderer.vue'

const props = defineProps<{ height?: string; ui?: DataListGridUi }>()
const dataListUi = useDataListUi()
const resolvedUi = computed<DataListGridUi>(() => ({
  ...dataListUi.ui.value.grid?.ui,
  ...props.ui,
}))
</script>

<template>
  <GridRenderer :height="height" :ui="resolvedUi">
    <template v-for="(_, name) in $slots" #[name]="scope">
      <slot :name="name" v-bind="scope ?? {}" />
    </template>
  </GridRenderer>
</template>
