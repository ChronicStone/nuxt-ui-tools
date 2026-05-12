<script setup lang="ts">
import { computed } from 'vue'

import UInput from '@nuxt/ui/components/Input.vue'

import type { FormDateField } from '../../types'
import { useFieldControl } from '../../composables/use-field-control'
import FormFieldShell from '../../components/renderer/FormFieldShell.vue'

const props = defineProps<{
  field: FormDateField
  path: readonly string[]
}>()

const { form, controlProps, disabled, handleBlur, placeholder } = useFieldControl(() => props.field, () => props.path)
const model = computed<string | undefined>({
  get: () => {
    const value = form.getValue(props.path)
    if (typeof value === 'string') return value
    if (value instanceof Date) return value.toISOString().slice(0, 10)
    return undefined
  },
  set: value => form.setValue(props.path, value ?? null),
})
</script>

<template>
  <FormFieldShell :field="field" :path="path">
    <UInput
      v-model="model"
      v-bind="controlProps"
      class="w-full"
      type="date"
      :placeholder="placeholder"
      :disabled="disabled"
      @blur="handleBlur"
    />
  </FormFieldShell>
</template>
