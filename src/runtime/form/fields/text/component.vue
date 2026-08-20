<script setup lang="ts">
import UInput from '@nuxt/ui/components/Input.vue'
import { computed } from 'vue'

import FormFieldShell from '../../components/renderer/FormFieldShell.vue'
import { useFieldControl } from '../../composables/use-field-control'
import type { FormTextField } from '../../types'
import { isString } from '../../utils/predicate'

const props = defineProps<{
  field: FormTextField
  path: readonly string[]
  bare?: boolean
}>()

const { form, controlProps, disabled, handleBlur, placeholder } = useFieldControl(
  () => props.field,
  () => props.path,
)
const model = computed<string | undefined>({
  get: () => {
    const value = form.getValue(props.path)
    return isString(value) ? value : undefined
  },
  set: (value) => form.setValue(props.path, value ?? null),
})
</script>

<template>
  <UInput
    v-if="bare"
    v-model="model"
    v-bind="controlProps"
    class="w-full"
    :type="field.inputType ?? 'text'"
    :placeholder="placeholder"
    :disabled="disabled"
    @blur="handleBlur"
  />
  <FormFieldShell v-else :field="field" :path="path">
    <UInput
      v-model="model"
      v-bind="controlProps"
      class="w-full"
      :type="field.inputType ?? 'text'"
      :placeholder="placeholder"
      :disabled="disabled"
      @blur="handleBlur"
    />
  </FormFieldShell>
</template>
