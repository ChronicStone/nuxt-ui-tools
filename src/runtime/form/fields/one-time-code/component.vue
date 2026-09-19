<script setup lang="ts">
import UPinInput from '@nuxt/ui/components/PinInput.vue'
import { computed } from 'vue'

import FormFieldShell from '../../components/renderer/form-field-shell.vue'
import { useFieldControl } from '../../composables/use-field-control'
import type { FormOneTimeCodeField } from '../../types'
import { isString } from '../../utils/predicate'

const props = defineProps<{
  field: FormOneTimeCodeField
  path: readonly string[]
}>()

const {
  form,
  controlProps,
  disabled,
  handleBlur,
  placeholder: controlPlaceholder,
} = useFieldControl(
  () => props.field,
  () => props.path,
)
const placeholder = computed(() =>
  props.field.placeholder === undefined ? '·' : controlPlaceholder.value,
)
const model = computed<string[]>({
  get: () => {
    const value = form.getValue(props.path)
    return isString(value) ? [...value] : []
  },
  set: (value) => form.setValue(props.path, value.join('')),
})
</script>

<template>
  <FormFieldShell :field="field" :path="path">
    <UPinInput
      v-model="model"
      v-bind="controlProps"
      :disabled="disabled"
      :length="field.length ?? 6"
      :mask="field.mask"
      :otp="field.otp ?? true"
      :type="field.inputType ?? 'text'"
      :placeholder="placeholder"
      @blur="handleBlur"
    />
  </FormFieldShell>
</template>
