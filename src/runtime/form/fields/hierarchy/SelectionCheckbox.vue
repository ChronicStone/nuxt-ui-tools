<script setup lang="ts">
import UCheckbox from '@nuxt/ui/components/Checkbox.vue'
import { formFieldInjectionKey, inputIdInjectionKey } from '@nuxt/ui/composables/useFormField'
import { provide, ref } from 'vue'

defineProps<{
  modelValue: boolean | 'indeterminate'
  label: string
  disabled?: boolean
  controlClass?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean | 'indeterminate']
}>()

provide(formFieldInjectionKey, undefined)
provide(inputIdInjectionKey, ref<string | undefined>(undefined))
</script>

<template>
  <UCheckbox
    :model-value="modelValue"
    :aria-label="label"
    :disabled="disabled"
    :ui="{ root: controlClass }"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>
