<script setup lang="ts">
import UCheckboxGroup from '@nuxt/ui/components/CheckboxGroup.vue'
import { computed } from 'vue'

import FormFieldShell from '../../components/renderer/FormFieldShell.vue'
import { useFieldControl } from '../../composables/use-field-control'
import type { FormValue } from '../../types'
import type { FormCheckboxGroupField, FormOptionValue } from '../../types'
import { formOptionKey } from '../../utils/options'
import { isBoolean, isNumber, isString, isUndefined } from '../../utils/predicate'
import { mergeFormUiClass } from '../../utils/ui'

const props = defineProps<{
  field: FormCheckboxGroupField
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
    props.field.orientation === 'horizontal' ? 'flex-wrap' : undefined,
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
      :orientation="field.orientation"
      :ui="groupUi"
      :variant="field.variant === 'table' ? 'list' : (field.variant ?? 'list')"
      :indicator="field.indicator"
      :disabled="disabled"
      @blur="handleBlur"
    />
  </FormFieldShell>
</template>
