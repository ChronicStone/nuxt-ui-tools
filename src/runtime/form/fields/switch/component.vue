<script setup lang="ts">
import USwitch from '@nuxt/ui/components/Switch.vue'
import { computed } from 'vue'

import FormFieldShell from '../../components/renderer/form-field-shell.vue'
import { useFieldControl } from '../../composables/use-field-control'
import { useFormFieldBare } from '../../composables/use-form-field-chrome'
import type { FormSwitchField } from '../../types'

const props = defineProps<{
  field: FormSwitchField
  path: readonly string[]
}>()
const bare = useFormFieldBare()

const { fieldProps, form, controlProps, disabled, handleBlur, validationPending } = useFieldControl(
  () => props.field,
  () => props.path,
  { omit: ['trueValue', 'falseValue'] },
)
const model = computed<boolean>({
  get: () => {
    const value = form.getValue(props.path)
    return value === (fieldProps.value.trueValue ?? true)
  },
  set: (value) =>
    form.setValue(
      props.path,
      value ? (fieldProps.value.trueValue ?? true) : (fieldProps.value.falseValue ?? false),
    ),
})
</script>

<template>
  <FormFieldShell
    v-slot="{ label, description, required }"
    :field="field"
    :path="path"
    inline-label
  >
    <USwitch
      v-model="model"
      v-bind="controlProps"
      :label="bare ? undefined : label"
      :description="bare ? undefined : description"
      :required="required"
      :disabled="disabled"
      :checked-icon="fieldProps.checkedIcon"
      :unchecked-icon="fieldProps.uncheckedIcon"
      :loading="validationPending || fieldProps.loading"
      @change="handleBlur"
    />
  </FormFieldShell>
</template>
