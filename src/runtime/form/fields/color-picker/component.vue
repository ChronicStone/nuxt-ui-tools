<script setup lang="ts">
import { computed } from 'vue'

import UColorPicker from '@nuxt/ui/components/ColorPicker.vue'

import type { FormColorPickerField } from '../../types'
import { useFieldControl } from '../../composables/use-field-control'
import FormFieldShell from '../../components/renderer/FormFieldShell.vue'

const props = defineProps<{
  field: FormColorPickerField
  path: readonly string[]
}>()

const { form, controlProps, disabled } = useFieldControl(() => props.field, () => props.path)
const model = computed<string | undefined>({
  get: () => {
    const value = form.getValue(props.path)
    return typeof value === 'string' ? value : undefined
  },
  set: value => form.setValue(props.path, value ?? null),
})
</script>

<template>
  <FormFieldShell :field="field" :path="path">
    <UColorPicker
      v-model="model"
      v-bind="controlProps"
      :disabled="disabled"
      :format="field.format ?? 'hex'"
      :throttle="field.throttle"
    />
  </FormFieldShell>
</template>
