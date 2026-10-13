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
import { choiceCardGroupAttrs, groupChoiceCardItems } from '../choice-card/utils'
import type { ChoiceCardGroup } from '../choice-card/utils'

const props = defineProps<{
  field: FormCheckboxCardField
  path: readonly string[]
}>()

const { fieldProps, form, controlProps, disabled, handleBlur, options } = useFieldControl(
  () => props.field,
  () => props.path,
  { omit: CHOICE_CARD_PROPS },
)
const cards = useChoiceCard({
  kind: 'checkbox',
  props: () => fieldProps.value,
  ui: () => controlProps.value.ui,
})
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
// rendered by the card content instead. A compact card renders its description itself, beside
// the icon, so the group draws none.
const items = computed(() =>
  options.items.value.map(({ icon: _icon, ...item }) => ({
    ...item,
    description: cards.compact.value ? undefined : item.description,
    value: formOptionKey(item.value),
  })),
)
// Options with a `group` are listed under their headings, one checkbox group per heading.
const groups = computed(() => groupChoiceCardItems(items.value))

function selectionOf(group: ChoiceCardGroup<(typeof items.value)[number]>) {
  return model.value.filter((key) => group.items.some((item) => item.value === key))
}

/** Applies what one group changed to the whole selection, keeping the order of the others. */
function update(group: ChoiceCardGroup<(typeof items.value)[number]>, keys: string[]) {
  const kept = model.value.filter(
    (key) => keys.includes(key) || !group.items.some((item) => item.value === key),
  )
  model.value = [...kept, ...keys.filter((key) => !kept.includes(key))]
}

function isOptionValue(value: FormValue): value is FormOptionValue {
  return isString(value) || isNumber(value) || isBoolean(value)
}
</script>

<template>
  <FormFieldShell :field="field" :path="path">
    <div :class="cards.groupsClass.value">
      <UCheckboxGroup
        v-for="(group, index) in groups"
        :key="group.key"
        :model-value="selectionOf(group)"
        v-bind="choiceCardGroupAttrs(controlProps, index)"
        :items="group.items"
        value-key="value"
        label-key="label"
        description-key="description"
        variant="card"
        :legend="group.heading"
        :orientation="cards.orientation.value"
        :indicator="cards.indicator.value"
        :ui="cards.ui.value"
        :style="cards.style.value"
        :disabled="disabled"
        @update:model-value="update(group, $event)"
        @blur="handleBlur"
      >
        <template #label="{ item }">
          <ChoiceCardLabel
            :label="optionByKey.get(item.value)?.label ?? item.label"
            :description="
              cards.compact.value ? optionByKey.get(item.value)?.description : undefined
            "
            :icon="optionByKey.get(item.value)?.icon"
            :value="optionByKey.get(item.value)?.value"
            :tile="cards.tile.value"
            :compact="cards.compact.value"
            :mark="cards.mark.value"
            :selected="model.includes(item.value)"
            :ui="cards.ui.value"
          />
        </template>
      </UCheckboxGroup>
    </div>
  </FormFieldShell>
</template>
