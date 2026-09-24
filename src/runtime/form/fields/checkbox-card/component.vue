<script setup lang="ts">
import UCheckboxGroup from '@nuxt/ui/components/CheckboxGroup.vue'
import { computed } from 'vue'

import FormFieldShell from '../../components/renderer/form-field-shell.vue'
import { useFieldControl } from '../../composables/use-field-control'
import type { FormValue, FormCheckboxCardField, FormOptionValue } from '../../types'
import { formOptionKey } from '../../utils/options'
import { isBoolean, isNumber, isString, isUndefined } from '../../utils/predicate'
import ChoiceCardLabel from '../choice-card/choice-card-label.vue'
import { CHOICE_CARD_PROPS, useChoiceCard } from '../choice-card/use-choice-card'

const props = defineProps<{
  field: FormCheckboxCardField
  path: readonly string[]
}>()

const { fieldProps, form, controlProps, disabled, handleBlur, options } = useFieldControl(
  () => props.field,
  () => props.path,
  { omit: CHOICE_CARD_PROPS },
)
const cards = useChoiceCard({ props: () => fieldProps.value, ui: () => controlProps.value.ui })
const optionByKey = computed(
  () => new Map(options.items.value.map((item) => [formOptionKey(item.value), item])),
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
        const optionValue = optionByKey.value.get(key)?.value
        return isUndefined(optionValue) ? [] : [optionValue]
      }),
    ),
})
// Each item becomes a Nuxt UI checkbox, whose `icon` is its check mark: the option icon is
// rendered by the card content instead.
const items = computed(() =>
  options.items.value.map(({ icon: _icon, ...item }) => ({
    ...item,
    value: formOptionKey(item.value),
  })),
)

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
      variant="card"
      :orientation="cards.orientation.value"
      :indicator="cards.indicator.value"
      :ui="cards.ui.value"
      :style="cards.style.value"
      :disabled="disabled"
      @blur="handleBlur"
    >
      <template #label="{ item }">
        <ChoiceCardLabel
          :label="optionByKey.get(item.value)?.label ?? item.label"
          :icon="optionByKey.get(item.value)?.icon"
          :tile="cards.tile.value"
          :corner="cards.corner.value"
          :selected="model.includes(item.value)"
          :ui="cards.ui.value"
        />
      </template>
    </UCheckboxGroup>
  </FormFieldShell>
</template>
