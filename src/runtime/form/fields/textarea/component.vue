<script setup lang="ts">
import UTextarea from '@nuxt/ui/components/Textarea.vue'
import { computed } from 'vue'

import FormFieldShell from '../../components/renderer/FormFieldShell.vue'
import { useFieldControl } from '../../composables/use-field-control'
import type { FormTextareaField } from '../../types'
import { isString } from '../../utils/predicate'

const props = defineProps<{
  field: FormTextareaField
  path: readonly string[]
}>()

const { form, controlProps, disabled, handleBlur, placeholder } = useFieldControl(
  () => props.field,
  () => props.path,
)
const model = computed<string | undefined>({
  get: () => {
    const value = form.getValue(props.path)
    return isString(value) ? value : undefined
  },
  set: (value) => form.setValue(props.path, value ?? null),
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
