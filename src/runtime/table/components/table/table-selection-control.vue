<script setup lang="ts">
import UCheckbox from '@nuxt/ui/components/Checkbox.vue'
import { computed } from 'vue'

import { useDataListUi } from '../../composables/use-data-list-ui'
import type { DataListCheckboxProps } from '../../types'
import { mergeDataListProps } from '../../utils'

const props = defineProps<{
  modelValue: boolean | 'indeterminate'
  ariaLabel: string
}>()
const emit = defineEmits<{
  toggle: [event: MouseEvent]
}>()
const dataListUi = useDataListUi()
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
  <span class="inline-flex items-center" @click="toggle">
    <UCheckbox
      v-bind="checkboxProps"
      :model-value="props.modelValue"
      :aria-label="props.ariaLabel"
      class="nut-dl-check"
    />
  </span>
</template>
