<script setup lang="ts">
import URadioGroup from '@nuxt/ui/components/RadioGroup.vue'
import { computed } from 'vue'

import FormFieldShell from '../../components/renderer/form-field-shell.vue'
import { useFieldControl } from '../../composables/use-field-control'
import type { FormRadioCardField } from '../../types'
import { isBoolean, isNumber, isString } from '../../utils/predicate'
import ChoiceCardLabel from '../choice-card/choice-card-label.vue'
import { CHOICE_CARD_PROPS, useChoiceCard } from '../choice-card/use-choice-card'

const props = defineProps<{
  field: FormRadioCardField
  path: readonly string[]
}>()

const { fieldProps, form, controlProps, disabled, handleBlur, options } = useFieldControl(
  () => props.field,
  () => props.path,
  { omit: CHOICE_CARD_PROPS },
)
const cards = useChoiceCard({ props: () => fieldProps.value, ui: () => controlProps.value.ui })
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
const items = computed(() => [...options.items.value])
</script>

<template>
  <FormFieldShell :field="field" :path="path">
    <URadioGroup
      v-model="model"
      v-bind="controlProps"
      value-key="value"
      label-key="label"
      variant="card"
      :items="items"
      :orientation="cards.orientation.value"
      :indicator="cards.indicator.value"
      :ui="cards.ui.value"
      :style="cards.style.value"
      :disabled="disabled"
      @blur="handleBlur"
    >
      <template #label="{ item }">
        <ChoiceCardLabel
          :label="item.label"
          :icon="item.icon"
          :tile="cards.tile.value"
          :corner="cards.corner.value"
          :selected="model === item.value"
          :ui="cards.ui.value"
        />
      </template>
    </URadioGroup>
  </FormFieldShell>
</template>
