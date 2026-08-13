<script setup lang="ts">
import UCheckboxGroup from '@nuxt/ui/components/CheckboxGroup.vue'
import { computed } from 'vue'

import FormFieldShell from '../../components/renderer/FormFieldShell.vue'
import { useFieldControl } from '../../composables/use-field-control'
import type { FormCheckboxCardField, FormOptionValue } from '../../types'
import { formOptionKey } from '../../utils/options'

const props = defineProps<{
  field: FormCheckboxCardField
  path: readonly string[]
}>()

const { form, controlProps, disabled, handleBlur, options } = useFieldControl(
  () => props.field,
  () => props.path,
)
const valueByKey = computed<Map<string, FormOptionValue>>(
  () => new Map(options.items.value.map((item) => [formOptionKey(item.value), item.value])),
)
const model = computed<string[]>({
  get: () => {
    const value = form.getValue(props.path)
    return Array.isArray(value) ? value.filter(isOptionValue).map(formOptionKey) : []
  },
  set: (value) =>
    form.setValue(
      props.path,
      value.flatMap((key) => {
        const optionValue = valueByKey.value.get(key)
        return typeof optionValue === 'undefined' ? [] : [optionValue]
      }),
    ),
})
const items = computed(() =>
  options.items.value.map((item) => ({ ...item, value: formOptionKey(item.value) })),
)

function isOptionValue(value: unknown): value is FormOptionValue {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
}
</script>

<template>
  <FormFieldShell :field="field" :path="path">
    <UCheckboxGroup
      v-model="model"
      v-bind="controlProps"
      :items="items"
      value-key="value"
      label-key="label"
      description-key="description"
      :orientation="field.orientation"
      variant="card"
      :indicator="field.indicator"
      :disabled="disabled"
      @blur="handleBlur"
    />
  </FormFieldShell>
</template>
