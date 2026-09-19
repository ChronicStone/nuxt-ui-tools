<script setup lang="ts">
import UFileUpload from '@nuxt/ui/components/FileUpload.vue'
import { computed, ref } from 'vue'

import { useUiToolsLocale } from '../../../i18n/use-locale'
import FormFieldShell from '../../components/renderer/form-field-shell.vue'
import FormFilePreview from '../../components/utils/form-file-preview.vue'
import { useFieldControl } from '../../composables/use-field-control'
import type { FormValue, FormFileField } from '../../types'
import { isDefined } from '../../utils/predicate'
import { resolveFormText } from '../../utils/text'

const props = defineProps<{
  field: FormFileField
  path: readonly string[]
}>()

const { t } = useUiToolsLocale()
const { fieldProps, form, controlProps, disabled, handleBlur } = useFieldControl(
  () => props.field,
  () => props.path,
  { omit: ['dropzoneLabel', 'dropzoneDescription'] },
)
const model = computed<File | File[] | null>({
  get: () => {
    const value = form.getValue(props.path)
    if (fieldProps.value.multiple) {
      return Array.isArray(value) ? value.filter(isFile) : []
    }
    return isFile(value) ? value : null
  },
  set: (value) =>
    form.setValue(props.path, fieldProps.value.multiple ? normalizeFiles(value) : (value ?? null)),
})

const openDialog = ref<(() => void) | null>(null)
const hasSingleFile = computed(() => {
  const { value } = model
  return !fieldProps.value.multiple && value !== null && !Array.isArray(value)
})
const dropzoneUi = computed(() => ({
  ...controlProps.value.ui,
  base: hasSingleFile.value ? 'hidden' : controlProps.value.ui?.base,
  file: hasSingleFile.value ? 'relative inset-auto p-0' : controlProps.value.ui?.file,
  files: hasSingleFile.value ? 'w-full' : 'mb-2 gap-2',
}))

function captureOpen(open: () => void) {
  openDialog.value = open
  return ''
}

function replaceFile() {
  openDialog.value?.()
}

function normalizeFiles(value: File | File[] | null) {
  if (Array.isArray(value)) {
    return value
  }
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
      :accept="fieldProps.accept"
      :multiple="fieldProps.multiple"
      :disabled="disabled"
      :label="resolveFormText(fieldProps.dropzoneLabel) ?? t('form.fields.file.drop')"
      :description="resolveFormText(fieldProps.dropzoneDescription)"
      :icon="fieldProps.icon"
      :variant="fieldProps.variant"
      :layout="fieldProps.layout"
      :dropzone="fieldProps.dropzone"
      :preview="fieldProps.preview"
      :interactive="fieldProps.interactive"
      position="outside"
      :ui="dropzoneUi"
      @change="handleBlur"
    >
      <template #files-top="{ open }">
        <span hidden>{{ captureOpen(open) }}</span>
      </template>
      <template #file="{ file, index, removeFile }">
        <FormFilePreview
          :file="file"
          :index="index"
          :disabled="disabled"
          :remove-file="removeFile"
          :replace="fieldProps.multiple ? undefined : replaceFile"
        />
      </template>
    </UFileUpload>
  </FormFieldShell>
</template>
