<script setup lang="ts">
import USwitch from '@nuxt/ui/components/Switch.vue'
import { computed } from 'vue'

import FormFieldShell from '../../components/renderer/FormFieldShell.vue'
import { useFieldControl } from '../../composables/use-field-control'
import { useFormFieldBare } from '../../composables/use-form-field-chrome'
import type { FormSwitchField } from '../../types'

const props = defineProps<{
  field: FormSwitchField
  path: readonly string[]
}>()
const bare = useFormFieldBare()

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
      :checked-icon="field.checkedIcon"
      :unchecked-icon="field.uncheckedIcon"
      :loading="field.loading"
      @change="handleBlur"
    />
  </FormFieldShell>
</template>
