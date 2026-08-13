<script setup lang="ts">
import UCheckbox from '@nuxt/ui/components/Checkbox.vue'
import { computed } from 'vue'

import FormFieldShell from '../../components/renderer/FormFieldShell.vue'
import { useFieldControl } from '../../composables/use-field-control'
import type { FormCheckboxField } from '../../types'

const props = defineProps<{
  field: FormCheckboxField
  path: readonly string[]
}>()

const { form, controlProps, disabled, handleBlur } = useFieldControl(
  () => props.field,
  () => props.path,
)
const model = computed<boolean>({
  get: () => form.getValue(props.path) === true,
  set: (value) => form.setValue(props.path, value),
})
</script>

<template>
  <FormFieldShell :field="field" :path="path">
    <UCheckbox v-model="model" v-bind="controlProps" :disabled="disabled" @blur="handleBlur" />
  </FormFieldShell>
</template>
