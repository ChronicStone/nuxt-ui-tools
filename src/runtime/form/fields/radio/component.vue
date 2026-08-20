<script setup lang="ts">
import URadioGroup from '@nuxt/ui/components/RadioGroup.vue'
import { computed } from 'vue'

import FormFieldShell from '../../components/renderer/FormFieldShell.vue'
import { useFieldControl } from '../../composables/use-field-control'
import type { FormRadioField } from '../../types'
import { isBoolean, isNumber, isString } from '../../utils/predicate'

const props = defineProps<{
  field: FormRadioField
  path: readonly string[]
}>()

const { form, controlProps, disabled, handleBlur, options } = useFieldControl(
  () => props.field,
  () => props.path,
)
const model = computed<string | number | boolean | undefined>({
  get: () => {
    const value = form.getValue(props.path)
    if (isString(value) || isNumber(value) || isBoolean(value)) return value
    return undefined
  },
  set: (value) => form.setValue(props.path, value),
})
const items = computed(() => [...options.items.value])
</script>

<template>
  <FormFieldShell :field="field" :path="path">
    <URadioGroup
      v-model="model"
      v-bind="controlProps"
      value-key="value"
      label-key="label"
      :items="items"
      :disabled="disabled"
      @blur="handleBlur"
    />
  </FormFieldShell>
</template>
