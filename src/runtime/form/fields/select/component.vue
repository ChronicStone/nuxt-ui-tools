<script setup lang="ts">
import { computed } from 'vue'

import USelectMenu from '@nuxt/ui/components/SelectMenu.vue'

import type { FormOptionValue, FormSelectField } from '../../types'
import { useFieldControl } from '../../composables/use-field-control'
import FormFieldShell from '../../components/renderer/FormFieldShell.vue'

const props = defineProps<{
  field: FormSelectField
  path: readonly string[]
}>()

const { form, controlProps, disabled, handleBlur, options, placeholder } = useFieldControl(() => props.field, () => props.path)
const model = computed<FormOptionValue | FormOptionValue[] | null | undefined>({
  get: () => {
    const value = form.getValue(props.path)
    if (Array.isArray(value)) return value.filter(isOptionValue)
    if (isOptionValue(value)) return value
    return null
  },
  set: value => form.setValue(props.path, value),
})
const items = computed(() => [...options.items.value])

function isOptionValue(value: unknown): value is FormOptionValue {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
}
</script>

<template>
  <FormFieldShell :field="field" :path="path">
    <USelectMenu
      v-model="model"
      v-bind="controlProps"
      class="w-full"
      value-key="value"
      label-key="label"
      :items="items"
      :multiple="field.multiple"
      :placeholder="placeholder"
      :disabled="disabled"
      :loading="options.loading.value"
      :search-input="field.searchable ?? false"
      :clear="field.clearable ?? true"
      @blur="handleBlur"
    />
  </FormFieldShell>
</template>
