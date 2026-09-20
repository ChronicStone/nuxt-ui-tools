<script setup lang="ts">
import USlider from '@nuxt/ui/components/Slider.vue'
import { computed } from 'vue'

import FormFieldShell from '../../components/renderer/form-field-shell.vue'
import { useFieldControl } from '../../composables/use-field-control'
import type { FormSliderField } from '../../types'
import { isNumber } from '../../utils/predicate'

const props = defineProps<{
  field: FormSliderField
  path: readonly string[]
}>()

const { fieldProps, form, controlProps, disabled, handleBlur } = useFieldControl(
  () => props.field,
  () => props.path,
)
const model = computed<number | number[] | undefined>({
  get: () => {
    const value = form.getValue(props.path)
    if (isNumber(value)) {
      return value
    }
    if (Array.isArray(value) && value.every((item) => isNumber(item))) {
      return value
    }
    return fieldProps.value.multiple ? [] : undefined
  },
  set: (value) => form.setValue(props.path, value ?? (fieldProps.value.multiple ? [] : null)),
})
</script>

<template>
  <FormFieldShell :field="field" :path="path">
    <USlider
      v-model="model"
      v-bind="controlProps"
      :disabled="disabled"
      :min="fieldProps.min"
      :max="fieldProps.max"
      :step="fieldProps.step"
      :tooltip="fieldProps.tooltip ?? true"
      @change="handleBlur"
    />
  </FormFieldShell>
</template>
