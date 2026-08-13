<script setup lang="ts">
import UInput from '@nuxt/ui/components/Input.vue'
import { ref, watch } from 'vue'

import type { DataListSearchUi } from '../../types'

const props = defineProps<{
  placeholder: string
  loading?: boolean
  size?: 'xs' | 'sm' | 'md' | 'lg'
  ui?: DataListSearchUi
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

function commitValue() {
  if (localValue.value === model.value) return
  model.value = localValue.value
}
</script>

<template>
  <UInput
    :model-value="localValue"
    :size="props.size ?? 'md'"
    color="primary"
    variant="outline"
    icon="i-lucide-search"
    :loading="loading"
    :placeholder="placeholder"
    :ui="ui"
    class="max-w-full shrink-0"
    @update:model-value="localValue = String($event ?? '')"
    @blur="commitValue"
    @keydown.enter.prevent="commitValue"
  />
</template>
