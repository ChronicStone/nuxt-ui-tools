<script setup lang="ts">
import { useTableInternals } from '../../composables/use-table-internals'
import type { DataListColumnPanelUi, DataListControlSize } from '../../types'
import ColumnPanel from '../drawers/ColumnPanel.vue'

defineProps<{ size?: DataListControlSize; ui?: DataListColumnPanelUi }>()
const internals = useTableInternals()
</script>

<template>
  <ColumnPanel v-if="internals.controls.tableLayout.value === 'table'" :size="size" :ui="ui">
    <template v-if="$slots.trigger" #trigger="scope">
      <slot name="trigger" v-bind="scope" />
    </template>
  </ColumnPanel>
</template>
