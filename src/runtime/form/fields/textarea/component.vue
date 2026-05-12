<script setup lang="ts">
import { computed } from 'vue'

import UTextarea from '@nuxt/ui/components/Textarea.vue'

import type { FormTextareaField } from '../../types'
import { useFieldControl } from '../../composables/use-field-control'
import FormFieldShell from '../../components/renderer/FormFieldShell.vue'

const props = defineProps<{
  field: FormTextareaField
  path: readonly string[]
}>()

const { form, controlProps, disabled, handleBlur, placeholder } = useFieldControl(() => props.field, () => props.path)
const model = computed<string | undefined>({
  get: () => {
    const value = form.getValue(props.path)
    return typeof value === 'string' ? value : undefined
  },
  set: value => form.setValue(props.path, value ?? null),
})
</script>

<template>
  <FormFieldShell :field="field" :path="path">
    <UTextarea
      v-model="model"
      v-bind="controlProps"
      class="w-full"
      :placeholder="placeholder"
      :disabled="disabled"
      @blur="handleBlur"
    />
  </FormFieldShell>
</template>
