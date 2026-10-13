<script setup lang="ts">
import URadioGroup from '@nuxt/ui/components/RadioGroup.vue'
import { computed } from 'vue'

import FormFieldShell from '../../components/renderer/form-field-shell.vue'
import FormOptionChoiceLabel from '../../components/utils/form-option-choice-label.vue'
import { useChoiceGroupItems } from '../../composables/use-choice-group-items'
import { useFieldControl } from '../../composables/use-field-control'
import type { FormRadioField } from '../../types'
import { formOptionKey } from '../../utils/options'
import { isBoolean, isNumber, isString } from '../../utils/predicate'
import { mergeFormUiClass } from '../../utils/ui'
import { CARD_SELECTED_RING } from '../card-selection'

const props = defineProps<{
  field: FormRadioField
  path: readonly string[]
}>()

const { fieldProps, form, controlProps, disabled, handleBlur, options } = useFieldControl(
  () => props.field,
  () => props.path,
)
const model = computed<string | number | boolean | undefined>({
  get: () => {
    const value = form.getValue(props.path)
    if (isString(value) || isNumber(value) || isBoolean(value)) {
      return value
    }
    return undefined
  },
  set: (value) => form.setValue(props.path, value),
})
const renderOption = computed(() => props.field.renderOption)
const { items, optionOf } = useChoiceGroupItems({
  custom: () => renderOption.value !== undefined,
  options,
  ui: () => controlProps.value.ui,
  valueOf: (option) => option.value,
})
const groupUi = computed(() => ({
  ...controlProps.value.ui,
  item: mergeFormUiClass(
    fieldProps.value.variant === 'card' ? CARD_SELECTED_RING : undefined,
    controlProps.value.ui?.item,
  ),
}))
</script>

<template>
  <FormFieldShell :field="field" :path="path">
    <URadioGroup
      v-model="model"
      v-bind="controlProps"
      value-key="value"
      label-key="label"
      description-key="description"
      :items="items"
      :ui="groupUi"
      :variant="fieldProps.variant ?? 'list'"
      :orientation="fieldProps.orientation"
      :indicator="fieldProps.indicator"
      :disabled="disabled"
      @blur="handleBlur"
    >
      <template #label="{ item }">
        <FormOptionChoiceLabel
          :option="optionOf(formOptionKey(item.value))"
          :selected="model === item.value"
          :render="renderOption"
        />
      </template>
    </URadioGroup>
  </FormFieldShell>
</template>
