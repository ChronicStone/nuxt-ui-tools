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
    class="!bg-red-100"
    size="lg"
    color="primary"
    variant="outline"
    icon="i-lucide-search"
    :loading="loading"
    :placeholder="placeholder"
    :ui="{
      leadingIcon: 'text-muted',
      trailing: 'pe-2',
      root: 'focus-within:ring-1 focus-within:ring-inset focus-within:ring-primary',
    }"
    @update:model-value="emit('update:modelValue', String($event ?? ''))"
  />
</template>
