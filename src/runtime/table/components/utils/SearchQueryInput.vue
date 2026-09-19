<script setup lang="ts">
import UInput from '@nuxt/ui/components/Input.vue'
import { computed, ref, watch } from 'vue'

import type { DataListControlSize, DataListInputProps, DataListSearchUi } from '../../types'

const props = defineProps<{
  placeholder: string
  loading?: boolean
  size: DataListControlSize
  ui?: DataListSearchUi
  inputProps?: DataListInputProps
}>()
const model = defineModel<string>({ required: true })
const localValue = ref<string>(model.value)

watch(
  model,
  (value) => {
    if (value === localValue.value) return
    localValue.value = value
  },
  { flush: 'sync' },
)

const inputAttrs = computed<Record<string, unknown>>(() => ({
  color: 'neutral',
  variant: 'outline',
  icon: 'i-lucide-search',
  ...props.inputProps,
}))

function commitValue() {
  if (localValue.value === model.value) return
  model.value = localValue.value
}
</script>

<template>
  <UInput
    v-bind="inputAttrs"
    :model-value="localValue"
    :size="props.size"
    :loading="loading"
    :placeholder="placeholder"
    :ui="ui"
    class="nut-dl-search max-w-full shrink-0"
    @update:model-value="localValue = String($event ?? '')"
    @blur="commitValue"
    @keydown.enter.prevent="commitValue"
  />
</template>
