<script setup lang="ts">
import UCheckbox from '@nuxt/ui/components/Checkbox.vue'
import { computed } from 'vue'

import { useDataListUi } from '../../composables/use-data-list-ui'
import { useTableRowLabels } from '../../composables/use-table-row-labels'
import type { DataListCheckboxProps, GenericObject } from '../../types'
import { mergeDataListProps, mergeDataListUiClass } from '../../utils'

const props = defineProps<{
  modelValue: boolean | 'indeterminate'
  /** The record this checkbox selects; without one it selects every row. */
  row?: GenericObject
  /** Where the record sits in the rendered rows: it names the record when the schema has no `rowLabel`. */
  index?: number
}>()
const emit = defineEmits<{
  toggle: [event: MouseEvent]
}>()
const dataListUi = useDataListUi()
const labels = useTableRowLabels()
const areaClass = computed(() =>
  mergeDataListUiClass(
    'nut-dl-select inline-flex items-center',
    undefined,
    dataListUi.ui.value.table?.ui?.selectControl,
  ),
)
const ariaLabel = computed(() =>
  props.row ? labels.selectRow({ index: props.index ?? 0, row: props.row }) : labels.selectAll(),
)
const checkboxProps = computed(() =>
  mergeDataListProps<DataListCheckboxProps>(
    { color: 'primary', size: dataListUi.controlSize.value },
    dataListUi.ui.value.table?.props?.checkbox,
  ),
)

function toggle(event: MouseEvent) {
  event.preventDefault()
  event.stopPropagation()
  emit('toggle', event)
}
</script>

<template>
  <span :class="areaClass" @click="toggle">
    <UCheckbox
      v-bind="checkboxProps"
      :model-value="props.modelValue"
      :aria-label="ariaLabel"
      class="nut-dl-check"
    />
  </span>
</template>
