<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'
import URadioGroup from '@nuxt/ui/components/RadioGroup.vue'
import { computed } from 'vue'

import FormFieldShell from '../../components/renderer/form-field-shell.vue'
import { useFieldControl } from '../../composables/use-field-control'
import type { FormRadioCardField } from '../../types'
import { isBoolean, isNumber, isString } from '../../utils/predicate'
import { mergeFormUiClass } from '../../utils/ui'
import { CARD_SELECTED_RING } from '../card-selection'

const props = defineProps<{
  field: FormRadioCardField
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
const items = computed(() => [...options.items.value])
const groupUi = computed(() => ({
  ...controlProps.value.ui,
  fieldset: mergeFormUiClass(
    controlProps.value.ui?.fieldset,
    fieldProps.value.orientation === 'horizontal' ? 'flex-wrap' : undefined,
  ),
  item: mergeFormUiClass(CARD_SELECTED_RING, controlProps.value.ui?.item),
}))
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
      :orientation="fieldProps.orientation"
      :ui="groupUi"
      :disabled="disabled"
      @blur="handleBlur"
    >
      <template #label="{ item }">
        <span class="inline-flex items-center gap-2">
          <UIcon v-if="item.icon" :name="item.icon" class="size-4 shrink-0" aria-hidden="true" />
          <span>{{ item.label }}</span>
        </span>
      </template>
    </URadioGroup>
  </FormFieldShell>
</template>
