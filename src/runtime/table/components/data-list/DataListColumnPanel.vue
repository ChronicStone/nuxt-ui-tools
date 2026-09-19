<script setup lang="ts">
import { useDataListBreakpoint } from '../../composables/use-data-list-breakpoint'
import { useTableInternals } from '../../composables/use-table-internals'
import type {
  DataListColumnPanelProps,
  DataListColumnPanelUi,
  DataListControlSize,
} from '../../types'
import ColumnPanel from '../drawers/ColumnPanel.vue'

withDefaults(
  defineProps<{
    size?: DataListControlSize
    mobile?: boolean
    ui?: DataListColumnPanelUi
    props?: DataListColumnPanelProps
  }>(),
  { mobile: false },
)
const internals = useTableInternals()
const { isMobile } = useDataListBreakpoint()
</script>

<template>
  <ColumnPanel
    v-if="internals.controls.tableLayout.value === 'table' && (mobile || !isMobile)"
    :size="size"
    :ui="ui"
    :props="props"
  >
    <template v-if="$slots.trigger" #trigger="scope">
      <slot name="trigger" v-bind="scope" />
    </template>
  </ColumnPanel>
</template>
