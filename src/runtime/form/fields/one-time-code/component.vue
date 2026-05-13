<script setup lang="ts">
import { computed } from 'vue'

import UPinInput from '@nuxt/ui/components/PinInput.vue'

import type { FormOneTimeCodeField } from '../../types'
import { useFieldControl } from '../../composables/use-field-control'
import FormFieldShell from '../../components/renderer/FormFieldShell.vue'

const props = defineProps<{
  field: FormOneTimeCodeField
  path: readonly string[]
}>()

const { form, controlProps, disabled, handleBlur, placeholder } = useFieldControl(() => props.field, () => props.path)
const model = computed<string[]>({
  get: () => {
    const value = form.getValue(props.path)
    return typeof value === 'string' ? value.split('') : []
  },
  set: value => form.setValue(props.path, value.join('')),
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
