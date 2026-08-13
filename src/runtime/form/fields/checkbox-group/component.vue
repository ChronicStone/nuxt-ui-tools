<script setup lang="ts">
import UCheckbox from '@nuxt/ui/components/Checkbox.vue'
import { computed } from 'vue'

import FormFieldShell from '../../components/renderer/FormFieldShell.vue'
import { useFieldControl } from '../../composables/use-field-control'
import type { FormCheckboxGroupField, FormOptionValue } from '../../types'

const props = defineProps<{
  field: FormCheckboxGroupField
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

function toggleOption(value: FormOptionValue, checked: boolean) {
  const current = model.value
  if (checked) {
    model.value = current.includes(value) ? current : [...current, value]
    return
  }

  model.value = current.filter((item) => item !== value)
}

function isOptionValue(value: unknown): value is FormOptionValue {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
}
</script>

<template>
  <FormFieldShell :field="field" :path="path">
    <div
      v-bind="controlProps"
      class="grid gap-2"
      :class="field.orientation === 'horizontal' ? 'sm:flex sm:flex-wrap' : ''"
    >
      <UCheckbox
        v-for="item in items"
        :key="String(item.value)"
        :model-value="model.includes(item.value)"
        :label="item.label"
        :description="item.description"
        :disabled="disabled || item.disabled"
        :variant="field.variant ?? 'list'"
        :indicator="field.indicator"
        @update:model-value="toggleOption(item.value, $event === true)"
        @blur="handleBlur"
      />
    </div>
  </FormFieldShell>
</template>
