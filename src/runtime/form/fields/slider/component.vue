<script setup lang="ts">
import USlider from '@nuxt/ui/components/Slider.vue'
import { computed } from 'vue'

import FormFieldShell from '../../components/renderer/FormFieldShell.vue'
import { useFieldControl } from '../../composables/use-field-control'
import type { FormSliderField } from '../../types'

const props = defineProps<{
  field: FormSliderField
  path: readonly string[]
}>()

const { form, controlProps, disabled, handleBlur } = useFieldControl(
  () => props.field,
  () => props.path,
)
const model = computed<number | number[] | undefined>({
  get: () => {
    const value = form.getValue(props.path)
    if (typeof value === 'number') return value
    if (Array.isArray(value) && value.every((item) => typeof item === 'number')) return value
    return props.field.multiple ? [] : undefined
  },
  set: (value) => form.setValue(props.path, value ?? (props.field.multiple ? [] : null)),
})
</script>

<template>
  <FormFieldShell :field="field" :path="path">
    <USlider
      v-model="model"
      v-bind="controlProps"
      :disabled="disabled"
      :min="field.min"
      :max="field.max"
      :step="field.step"
      :tooltip="field.tooltip ?? true"
      @change="handleBlur"
    />
  </FormFieldShell>
</template>
