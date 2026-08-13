<script setup lang="ts">
import USwitch from '@nuxt/ui/components/Switch.vue'
import { computed } from 'vue'

import FormFieldShell from '../../components/renderer/FormFieldShell.vue'
import { useFieldControl } from '../../composables/use-field-control'
import type { FormSwitchField } from '../../types'

const props = defineProps<{
  field: FormSwitchField
  path: readonly string[]
}>()

const { form, controlProps, disabled, handleBlur } = useFieldControl(
  () => props.field,
  () => props.path,
)
const model = computed<boolean>({
  get: () => {
    const value = form.getValue(props.path)
    return value === (props.field.trueValue ?? true)
  },
  set: (value) =>
    form.setValue(
      props.path,
      value ? (props.field.trueValue ?? true) : (props.field.falseValue ?? false),
    ),
})
</script>

<template>
  <FormFieldShell :field="field" :path="path">
    <USwitch
      v-model="model"
      v-bind="controlProps"
      :disabled="disabled"
      :checked-icon="field.checkedIcon"
      :unchecked-icon="field.uncheckedIcon"
      :loading="field.loading"
      @change="handleBlur"
    />
  </FormFieldShell>
</template>
