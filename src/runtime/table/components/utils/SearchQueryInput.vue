<script setup lang="ts">
import UInput from '@nuxt/ui/components/Input.vue'

defineProps<{
  modelValue: string
  placeholder: string
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <UInput
    :model-value="modelValue"
    size="md"
    color="primary"
    variant="outline"
    icon="i-lucide-search"
    :loading="loading"
    :placeholder="placeholder"
    class="w-[21rem] max-w-full shrink-0"
    @update:model-value="emit('update:modelValue', String($event ?? ''))"
  />
</template>
