<script setup lang="ts">
import UAlert from '@nuxt/ui/components/Alert.vue'
import UButton from '@nuxt/ui/components/Button.vue'
import UFileUpload from '@nuxt/ui/components/FileUpload.vue'
import { computed, onScopeDispose, ref } from 'vue'

import FormFieldShell from '../../components/renderer/FormFieldShell.vue'
import { useFieldControl } from '../../composables/use-field-control'
import type { FormObject, FormUploadField } from '../../types'

type UploadedValue = string | FormObject | readonly string[] | readonly FormObject[] | null

const props = defineProps<{
  field: FormUploadField
  path: readonly string[]
}>()

const { form, controlProps, disabled, handleBlur, params } = useFieldControl(
  () => props.field,
  () => props.path,
)
const selectedFiles = ref<File | File[] | null>(null)
const uploadPending = ref<boolean>(false)
const uploadError = ref<string | null>(null)
const uploadRun = ref<number>(0)
const uploadedValue = computed<UploadedValue>(() => {
  const value = form.getValue(props.path)
  if (typeof value === 'string' || value === null) return value
  if (Array.isArray(value) && value.every((item) => typeof item === 'string')) return value
  if (Array.isArray(value) && value.every(isFormObject)) return value
  return isFormObject(value) ? value : null
})
const files = computed<readonly File[]>(() => {
  if (Array.isArray(selectedFiles.value)) return selectedFiles.value
  return selectedFiles.value ? [selectedFiles.value] : []
})

async function uploadFiles() {
  const run = uploadRun.value + 1
  uploadRun.value = run
  uploadError.value = null
  if (!files.value.length) return

  uploadPending.value = true
  try {
    const value = await props.field.upload.handler({
      ...params.value,
      files: files.value,
    })
    if (uploadRun.value !== run) return
    form.setValue(props.path, value)
    selectedFiles.value = null
  } catch (error) {
    if (uploadRun.value !== run) return
    uploadError.value = error instanceof Error ? error.message : 'Upload failed.'
  } finally {
    if (uploadRun.value === run) uploadPending.value = false
  }
}

async function removeUpload(value?: unknown) {
  uploadPending.value = true
  try {
    await props.field.upload.onDelete?.({
      ...params.value,
      value: typeof value === 'undefined' ? uploadedValue.value : value,
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
  start: uploadFiles,
  cancel: cancelUpload,
  retry: retryUpload,
  remove: removeUpload,
})
onScopeDispose(unregisterUpload)

function handleFileChange() {
  void handleBlur()
  if (props.field.autoUpload ?? false) void uploadFiles()
}

function isFormObject(value: unknown): value is FormObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
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
        :disabled="disabled || uploadPending"
        @change="handleFileChange"
      />

      <div class="flex flex-wrap items-center gap-2">
        <UButton
          icon="i-lucide-upload"
          :loading="uploadPending"
          :disabled="disabled || !files.length"
          @click="uploadFiles"
        >
          Upload
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
          Remove
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
