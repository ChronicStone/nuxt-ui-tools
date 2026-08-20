<script setup lang="ts">
import UCheckbox from '@nuxt/ui/components/Checkbox.vue'

import { useDataListUi } from '../../composables/use-data-list-ui'

const props = defineProps<{
  modelValue: boolean | 'indeterminate'
  ariaLabel: string
}>()
const emit = defineEmits<{
  toggle: [event: MouseEvent]
}>()
const dataListUi = useDataListUi()

function toggle(event: MouseEvent) {
  event.preventDefault()
  event.stopPropagation()
  emit('toggle', event)
}
</script>

<template>
  <span class="inline-flex items-center" @click="toggle">
    <UCheckbox
      :model-value="props.modelValue"
      color="neutral"
      :size="dataListUi.controlSize.value"
      :aria-label="props.ariaLabel"
    />
  </span>
</template>
