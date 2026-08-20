<script setup lang="ts">
import { computed } from 'vue'

import { useDataListUi } from '../../composables/use-data-list-ui'
import { useTableInternals } from '../../composables/use-table-internals'
import type {
  GenericObject,
  RenderableType,
  TableActionSlotProps,
  TableRuntimeRecord,
} from '../../types'
import { resolveDataListControlGeometry } from '../../utils'

const internals = useTableInternals()
const dataListUi = useDataListUi()
const geometry = computed(() => resolveDataListControlGeometry(dataListUi.controlSize.value))
type TableActionSlot = TableActionSlotProps<GenericObject, TableRuntimeRecord, TableRuntimeRecord>

defineSlots<{
  default?: (props: TableActionSlot) => RenderableType
  action?: (props: TableActionSlot) => RenderableType
}>()
</script>

<template>
  <div
    v-if="internals.actions.toolbarActions.value.length"
    :class="['flex items-center', geometry.toolbarGap]"
  >
    <template v-for="action in internals.actions.toolbarActions.value" :key="action.definition.key">
      <slot name="action" v-bind="action">
        <slot v-bind="action" />
      </slot>
    </template>
  </div>
</template>
