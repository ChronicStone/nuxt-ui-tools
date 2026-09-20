<script setup lang="ts">
import UCheckboxGroup from '@nuxt/ui/components/CheckboxGroup.vue'
import { computed } from 'vue'

import FormFieldShell from '../../components/renderer/form-field-shell.vue'
import { useFieldControl } from '../../composables/use-field-control'
import type { FormValue, FormCheckboxCardField, FormOptionValue } from '../../types'
import { formOptionKey } from '../../utils/options'
import { isBoolean, isNumber, isString, isUndefined } from '../../utils/predicate'
import { mergeFormUiClass } from '../../utils/ui'

const props = defineProps<{
  field: FormCheckboxCardField
  path: readonly string[]
}>()

const { fieldProps, form, controlProps, disabled, handleBlur, options } = useFieldControl(
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
        return isUndefined(optionValue) ? [] : [optionValue]
      }),
    ),
})
const items = computed(() =>
  options.items.value.map((item) => ({ ...item, value: formOptionKey(item.value) })),
)
const groupUi = computed(() => ({
  ...controlProps.value.ui,
  fieldset: mergeFormUiClass(
    controlProps.value.ui?.fieldset,
    fieldProps.value.orientation === 'horizontal' ? 'flex-wrap' : undefined,
  ),
}))

function isOptionValue(value: FormValue): value is FormOptionValue {
  return isString(value) || isNumber(value) || isBoolean(value)
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
      :orientation="fieldProps.orientation"
      :ui="groupUi"
      variant="card"
      :indicator="fieldProps.indicator"
      :disabled="disabled"
      @blur="handleBlur"
    />
  </FormFieldShell>
</template>
