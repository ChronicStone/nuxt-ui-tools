<script setup lang="ts">
import USwitch from '@nuxt/ui/components/Switch.vue'
import { computed, useId } from 'vue'

import FormFieldShell from '../../components/renderer/FormFieldShell.vue'
import { useFieldControl } from '../../composables/use-field-control'
import type { FormValue } from '../../types'
import type { FormOptionValue, FormSwitchGroupField } from '../../types'
import { formOptionKey } from '../../utils/options'
import { isBoolean, isNumber, isString } from '../../utils/predicate'

const props = defineProps<{
  field: FormSwitchGroupField
  path: readonly string[]
}>()

const { form, controlProps, disabled, handleBlur, options } = useFieldControl(
  () => props.field,
  () => props.path,
)
const model = computed<readonly FormOptionValue[]>({
  get: () => {
    const value = form.getValue(props.path)
    return Array.isArray(value) ? value.filter(isOptionValue) : []
  },
  set: (value) => form.setValue(props.path, value),
})
const items = computed(() => [...options.items.value])
const groupId = useId()

function toggleOption(value: FormOptionValue, checked: boolean) {
  const current = model.value
  if (checked) {
    model.value = current.includes(value) ? current : [...current, value]
    return
  }

  model.value = current.filter((item) => item !== value)
}

function isOptionValue(value: FormValue): value is FormOptionValue {
  return isString(value) || isNumber(value) || isBoolean(value)
}
</script>

<template>
  <FormFieldShell :field="field" :path="path">
    <div
      role="group"
      class="grid gap-3"
      :class="field.orientation === 'horizontal' ? 'sm:flex sm:flex-wrap' : ''"
    >
      <USwitch
        v-for="item in items"
        :id="`${groupId}:${formOptionKey(item.value)}`"
        :key="formOptionKey(item.value)"
        v-bind="controlProps"
        :model-value="model.includes(item.value)"
        :label="item.label"
        :aria-label="item.label"
        :description="item.description"
        :disabled="disabled || item.disabled"
        :checked-icon="field.checkedIcon"
        :unchecked-icon="field.uncheckedIcon"
        @update:model-value="toggleOption(item.value, $event === true)"
        @blur="handleBlur"
      />
    </div>
  </FormFieldShell>
</template>
