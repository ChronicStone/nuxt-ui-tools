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

const { form, controlProps, disabled, handleBlur, params, validationPending } = useFieldControl(
  () => props.field,
  () => props.path,
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
  if (props.field.autoUpload ?? false) {
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
        :accept="field.accept"
        :multiple="field.multiple"
        :disabled="disabled || uploadPending || validationPending"
        :label="resolveFormText(field.dropzoneLabel) ?? t('form.fields.file.drop')"
        :description="resolveFormText(field.dropzoneDescription)"
        :icon="field.icon"
        :variant="field.variant"
        :layout="field.fileLayout"
        :preview="field.preview"
        position="outside"
        @change="handleFileChange"
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
