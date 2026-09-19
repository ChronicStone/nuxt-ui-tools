<script setup lang="ts">
import UFileUpload from '@nuxt/ui/components/FileUpload.vue'
import { computed } from 'vue'

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
      @change="handleBlur"
    >
      <template #file="{ file, index, removeFile }">
        <FormFilePreview
          :file="file"
          :index="index"
          :disabled="disabled"
          :remove-file="removeFile"
        />
      </template>
    </UFileUpload>
  </FormFieldShell>
</template>
