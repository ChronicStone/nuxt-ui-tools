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
const { form, controlProps, disabled, handleBlur } = useFieldControl(
  () => props.field,
  () => props.path,
)
const model = computed<File | File[] | null>({
  get: () => {
    const value = form.getValue(props.path)
    if (props.field.multiple) {
      return Array.isArray(value) ? value.filter(isFile) : []
    }
    return isFile(value) ? value : null
  },
  set: (value) =>
    form.setValue(props.path, props.field.multiple ? normalizeFiles(value) : (value ?? null)),
})

const openDialog = ref<(() => void) | null>(null)
const hasSingleFile = computed(() => {
  const { value } = model
  return !props.field.multiple && value !== null && !Array.isArray(value)
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
      :accept="field.accept"
      :multiple="field.multiple"
      :disabled="disabled"
      :label="resolveFormText(field.dropzoneLabel) ?? t('form.fields.file.drop')"
      :description="resolveFormText(field.dropzoneDescription)"
      :icon="field.icon"
      :variant="field.variant"
      :layout="field.fileLayout"
      :dropzone="field.dropzone"
      :preview="field.preview"
      :interactive="field.interactive"
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
          :replace="field.multiple ? undefined : replaceFile"
        />
      </template>
    </UFileUpload>
  </FormFieldShell>
</template>
