<script setup lang="ts">
import { computed } from 'vue'

import FormFieldShell from '../../components/renderer/form-field-shell.vue'
import { useFieldControl } from '../../composables/use-field-control'
import type { FormCustomComponentField, FormValue } from '../../types'

const props = defineProps<{
  field: FormCustomComponentField
  path: readonly string[]
}>()

const { disabled, fieldProps, form, handleBlur, params } = useFieldControl(
  () => props.field,
  () => props.path,
)
const model = computed<FormValue>({
  get: () => form.getValue(props.path),
  set: (value) => form.setValue(props.path, value),
})
const rendered = computed(() => props.field.render?.(params.value))
const Rendered = () => rendered.value
</script>

<template>
  <FormFieldShell :field="field" :path="path">
    <component
      :is="field.component"
      v-if="field.component"
      v-bind="fieldProps"
      v-model="model"
      :disabled="disabled"
      @blur="handleBlur"
    />
    <Rendered v-else-if="rendered" />
  </FormFieldShell>
</template>
