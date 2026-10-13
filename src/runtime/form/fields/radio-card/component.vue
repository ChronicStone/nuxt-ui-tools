<script setup lang="ts">
import URadioGroup from '@nuxt/ui/components/RadioGroup.vue'
import { computed } from 'vue'

import FormFieldShell from '../../components/renderer/form-field-shell.vue'
import { useFieldControl } from '../../composables/use-field-control'
import type { FormRadioCardField, FormValue } from '../../types'
import { formOptionKey } from '../../utils/options'
import { isBoolean, isNumber, isString } from '../../utils/predicate'
import ChoiceCardLabel from '../choice-card/choice-card-label.vue'
import { CHOICE_CARD_PROPS, useChoiceCard } from '../choice-card/use-choice-card'
import type { ChoiceCardGroup } from '../choice-card/utils'
import { choiceCardGroupAttrs, groupChoiceCardItems } from '../choice-card/utils'

const props = defineProps<{
  field: FormRadioCardField
  path: readonly string[]
}>()

const { fieldProps, form, controlProps, disabled, handleBlur, options } = useFieldControl(
  () => props.field,
  () => props.path,
  { omit: CHOICE_CARD_PROPS },
)
const cards = useChoiceCard({
  kind: 'radio',
  props: () => fieldProps.value,
  ui: () => controlProps.value.ui,
})
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
const descriptionByKey = computed(
  () => new Map(options.items.value.map((item) => [formOptionKey(item.value), item.description])),
)
// A compact card renders its description itself, beside the icon: the group draws none.
const items = computed(() =>
  options.items.value.map((item) =>
    cards.compact.value ? { ...item, description: undefined } : item,
  ),
)
// Options with a `group` are listed under their headings, one radio group per heading; the
// selection lives in the group of the selected option and the others show none.
const groups = computed(() => groupChoiceCardItems(items.value))

function selectionOf(group: ChoiceCardGroup<(typeof items.value)[number]>) {
  return group.items.some((item) => item.value === model.value) ? model.value : undefined
}

function select(value: FormValue) {
  if (isString(value) || isNumber(value) || isBoolean(value)) model.value = value
}
</script>

<template>
  <FormFieldShell :field="field" :path="path">
    <div :class="cards.groupsClass.value">
      <URadioGroup
        v-for="(group, index) in groups"
        :key="group.key"
        :model-value="selectionOf(group)"
        v-bind="choiceCardGroupAttrs(controlProps, index)"
        value-key="value"
        label-key="label"
        variant="card"
        :legend="group.heading"
        :items="group.items"
        :orientation="cards.orientation.value"
        :indicator="cards.indicator.value"
        :ui="cards.ui.value"
        :style="cards.style.value"
        :disabled="disabled"
        @update:model-value="select"
        @blur="handleBlur"
      >
        <template #label="{ item }">
          <ChoiceCardLabel
            :label="item.label"
            :description="
              cards.compact.value ? descriptionByKey.get(formOptionKey(item.value)) : undefined
            "
            :icon="item.icon"
            :value="item.value"
            :tile="cards.tile.value"
            :compact="cards.compact.value"
            :mark="cards.mark.value"
            :selected="model === item.value"
            :ui="cards.ui.value"
          />
        </template>
      </URadioGroup>
    </div>
  </FormFieldShell>
</template>
