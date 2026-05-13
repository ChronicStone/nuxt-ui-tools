<script setup lang="ts">
import { computed } from 'vue'

import USwitch from '@nuxt/ui/components/Switch.vue'

import type { FormSwitchField } from '../../types'
import { useFieldControl } from '../../composables/use-field-control'
import FormFieldShell from '../../components/renderer/FormFieldShell.vue'

const props = defineProps<{
  field: FormSwitchField
  path: readonly string[]
}>()

const { form, controlProps, disabled, handleBlur } = useFieldControl(() => props.field, () => props.path)
const model = computed<boolean>({
  get: () => {
    const value = form.getValue(props.path)
    return value === (props.field.trueValue ?? true)
  },
  set: value => form.setValue(props.path, value ? props.field.trueValue ?? true : props.field.falseValue ?? false),
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
