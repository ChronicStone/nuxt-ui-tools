<script setup lang="ts">
import URadioGroup from '@nuxt/ui/components/RadioGroup.vue'
import { formFieldInjectionKey, inputIdInjectionKey } from '@nuxt/ui/composables/useFormField'
import { computed, provide, ref } from 'vue'

const props = defineProps<{
  value: string
  label: string
  selected: boolean
  disabled?: boolean
  controlClass?: string
}>()

const emit = defineEmits<{
  select: []
}>()
const items = computed(() => [{ value: props.value, label: props.label }])

provide(formFieldInjectionKey, undefined)
provide(inputIdInjectionKey, ref<string | undefined>(undefined))
</script>

<template>
  <URadioGroup
    :model-value="selected ? value : undefined"
    :items="items"
    :aria-label="label"
    :disabled="disabled"
    :ui="{ root: controlClass, label: 'sr-only' }"
    @update:model-value="emit('select')"
  />
</template>
