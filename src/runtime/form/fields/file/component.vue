<script setup lang="ts">
import UFileUpload from '@nuxt/ui/components/FileUpload.vue'
import { computed } from 'vue'

import FormFieldShell from '../../components/renderer/FormFieldShell.vue'
import { useFieldControl } from '../../composables/use-field-control'
import type { FormValue } from '../../types'
import type { FormFileField } from '../../types'
import { isDefined } from '../../utils/predicate'

const props = defineProps<{
  field: FormFileField
  path: readonly string[]
}>()

const { form, controlProps, disabled, handleBlur } = useFieldControl(
  () => props.field,
  () => props.path,
)
const model = computed<File | File[] | null>({
  get: () => {
    const value = form.getValue(props.path)
    if (props.field.multiple) return Array.isArray(value) ? value.filter(isFile) : []
    return isFile(value) ? value : null
  },
  set: (value) =>
    form.setValue(props.path, props.field.multiple ? normalizeFiles(value) : (value ?? null)),
})

function normalizeFiles(value: File | File[] | null) {
  if (Array.isArray(value)) return value
  return value ? [value] : []
}

function isFile(value: FormValue): value is File {
  return import.meta.client && isDefined(globalThis.File) && value instanceof globalThis.File
}
</script>

<template>
  <FormFieldShell :field="field" :path="path">
    <UFileUpload
      v-model="model"
      v-bind="controlProps"
      class="w-full"
      :accept="field.accept"
      :multiple="field.multiple"
      :disabled="disabled"
      @change="handleBlur"
    />
  </FormFieldShell>
</template>
