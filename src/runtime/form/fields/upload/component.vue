<script setup lang="ts">
import UAlert from '@nuxt/ui/components/Alert.vue'
import UButton from '@nuxt/ui/components/Button.vue'
import UFileUpload from '@nuxt/ui/components/FileUpload.vue'
import UProgress from '@nuxt/ui/components/Progress.vue'
import { computed, onScopeDispose, ref } from 'vue'

import { useUiToolsLocale } from '../../../i18n/use-locale'
import FormFieldShell from '../../components/renderer/form-field-shell.vue'
import FormFilePreview from '../../components/utils/form-file-preview.vue'
import { useFieldControl } from '../../composables/use-field-control'
import type { FormValue, FormObject, FormUploadField } from '../../types'
import { isObject, isString, isUndefined } from '../../utils/predicate'
import { resolveFormText } from '../../utils/text'

type UploadedValue = string | FormObject | readonly string[] | readonly FormObject[] | null

const props = defineProps<{
  field: FormUploadField
  path: readonly string[]
}>()
const { t } = useUiToolsLocale()

const { fieldProps, form, controlProps, disabled, handleBlur, params, validationPending } =
  useFieldControl(
    () => props.field,
    () => props.path,
    { omit: ['dropzoneLabel', 'dropzoneDescription', 'autoUpload'] },
  )
const selectedFiles = ref<File | File[] | null>(null)
const uploadPending = ref<boolean>(false)
const uploadError = ref<string | null>(null)
const uploadProgress = ref<number | null>(null)
const uploadRun = ref<number>(0)
const uploadedValue = computed<UploadedValue>(() => {
  const value = form.getValue(props.path)
  if (isString(value) || value === null) {
    return value
  }
  if (Array.isArray(value) && value.every((item) => isString(item))) {
    return value
  }
  if (Array.isArray(value) && value.every(isFormObject)) {
    return value
  }
  return isFormObject(value) ? value : null
})
const files = computed<readonly File[]>(() => {
  if (Array.isArray(selectedFiles.value)) {
    return selectedFiles.value
  }
  return selectedFiles.value ? [selectedFiles.value] : []
})

const openDialog = ref<(() => void) | null>(null)
const hasSingleFile = computed(() => {
  const { value } = selectedFiles
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

async function uploadFiles() {
  const run = uploadRun.value + 1
  uploadRun.value = run
  uploadError.value = null
  if (!files.value.length) {
    return
  }

  uploadPending.value = true
  try {
    uploadProgress.value = null
    const value = await props.field.upload.handler({
      ...params.value,
      files: files.value,
      onProgress: (percent: number) => {
        if (uploadRun.value === run) {
          uploadProgress.value = Math.min(100, Math.max(0, percent))
        }
      },
    })
    if (uploadRun.value !== run) {
      return
    }
    form.setValue(props.path, value)
    selectedFiles.value = null
  } catch (error) {
    if (uploadRun.value !== run) {
      return
    }
    uploadError.value = error instanceof Error ? error.message : t('form.fields.upload.failed')
  } finally {
    if (uploadRun.value === run) {
      uploadPending.value = false
      uploadProgress.value = null
    }
  }
}

async function removeUpload(value?: FormValue) {
  uploadPending.value = true
  try {
    await props.field.upload.onDelete?.({
      ...params.value,
      value: isUndefined(value) ? uploadedValue.value : value,
    })
    form.setValue(props.path, null)
    selectedFiles.value = null
  } finally {
    uploadPending.value = false
  }
}

async function cancelUpload() {
  uploadRun.value += 1
  uploadPending.value = false
}

async function retryUpload() {
  await uploadFiles()
}

const unregisterUpload = form.registerFieldUpload(props.path, {
  cancel: cancelUpload,
  remove: removeUpload,
  retry: retryUpload,
  start: uploadFiles,
})
onScopeDispose(unregisterUpload)

function handleFileChange() {
  void handleBlur()
  if (fieldProps.value.autoUpload ?? false) {
    void uploadFiles()
  }
}

function isFormObject(value: FormValue): value is FormObject {
  return isObject(value) && value !== null && !Array.isArray(value)
}
</script>

<template>
  <FormFieldShell :field="field" :path="path">
    <div class="grid gap-3">
      <UFileUpload
        v-model="selectedFiles"
        v-bind="controlProps"
        class="w-full"
        :accept="fieldProps.accept"
        :multiple="fieldProps.multiple"
        :disabled="disabled || uploadPending || validationPending"
        :label="resolveFormText(fieldProps.dropzoneLabel) ?? t('form.fields.file.drop')"
        :description="resolveFormText(fieldProps.dropzoneDescription)"
        :icon="fieldProps.icon"
        :variant="fieldProps.variant"
        :layout="fieldProps.layout"
        :preview="fieldProps.preview"
        position="outside"
        :ui="dropzoneUi"
        @change="handleFileChange"
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
      <UProgress
        v-if="uploadPending && uploadProgress !== null"
        :model-value="uploadProgress"
        size="sm"
        data-form-upload-progress=""
      />

      <div class="flex flex-wrap items-center gap-2">
        <UButton
          icon="i-lucide-upload"
          :loading="uploadPending"
          :disabled="disabled || !files.length"
          @click="uploadFiles"
        >
          {{ t('form.fields.upload.upload') }}
        </UButton>
        <UButton
          v-if="uploadedValue"
          icon="i-lucide-trash-2"
          color="neutral"
          variant="soft"
          :loading="uploadPending"
          :disabled="disabled"
          @click="removeUpload"
        >
          {{ t('form.fields.upload.remove') }}
        </UButton>
      </div>

      <UAlert
        v-if="uploadError"
        color="error"
        variant="soft"
        icon="i-lucide-circle-alert"
        :description="uploadError"
      />
    </div>
  </FormFieldShell>
</template>
