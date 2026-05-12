<script setup lang="ts">
import { computed } from 'vue'

import UInputNumber from '@nuxt/ui/components/InputNumber.vue'

import type { FormNumberField } from '../../types'
import { useFieldControl } from '../../composables/use-field-control'
import FormFieldShell from '../../components/renderer/FormFieldShell.vue'

const props = defineProps<{
  field: FormNumberField
  path: readonly string[]
}>()

const { form, controlProps, disabled, handleBlur, placeholder } = useFieldControl(() => props.field, () => props.path)
const model = computed<number | undefined>({
  get: () => {
    const value = form.getValue(props.path)
    return typeof value === 'number' ? value : undefined
  },
  set: value => form.setValue(props.path, value ?? null),
})
</script>

<template>
  <FormFieldShell :field="field" :path="path">
    <UInputNumber
      v-model="model"
      v-bind="controlProps"
      class="w-full"
      :placeholder="placeholder"
      :disabled="disabled"
      :min="field.min"
      :max="field.max"
      :step="field.step"
      @blur="handleBlur"
    />
  </FormFieldShell>
</template>
