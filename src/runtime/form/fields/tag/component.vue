<script setup lang="ts">
import UInputTags from '@nuxt/ui/components/InputTags.vue'
import { computed } from 'vue'

import FormFieldShell from '../../components/renderer/FormFieldShell.vue'
import { useFieldControl } from '../../composables/use-field-control'
import type { FormTagField } from '../../types'

const props = defineProps<{
  field: FormTagField
  path: readonly string[]
}>()

const { form, controlProps, disabled, handleBlur, placeholder } = useFieldControl(
  () => props.field,
  () => props.path,
)
const model = computed<string[]>({
  get: () => {
    const value = form.getValue(props.path)
    return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : []
  },
  set: (value) => form.setValue(props.path, value),
})
</script>

<template>
  <FormFieldShell :field="field" :path="path">
    <UInputTags
      v-model="model"
      v-bind="controlProps"
      class="w-full"
      :placeholder="placeholder"
      :disabled="disabled"
      @blur="handleBlur"
    />
  </FormFieldShell>
</template>
