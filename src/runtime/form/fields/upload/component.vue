<script setup lang="ts">
import UFileUpload from '@nuxt/ui/components/FileUpload.vue'
import { computed, onScopeDispose, shallowRef, useTemplateRef, watch } from 'vue'

import { useUiToolsLocale } from '../../../i18n/use-locale'
import FormFieldShell from '../../components/renderer/form-field-shell.vue'
import { useFieldControl } from '../../composables/use-field-control'
import type { FormUploadField } from '../../types'
import { resolveFormText } from '../../utils/text'
import UploadItem from './upload-item.vue'
import { useUploadItems } from './use-upload-items'

const props = defineProps<{
  field: FormUploadField
  path: readonly string[]
}>()
const { t } = useUiToolsLocale()

const { api, fieldProps, form, controlProps, disabled, handleBlur, validationPending } =
  useFieldControl(
    () => props.field,
    () => props.path,
    { omit: ['dropzoneLabel', 'dropzoneDescription', 'autoUpload', 'max', 'preview'] },
  )
const uploads = useUploadItems(
  () => props.field,
  () => props.path,
)
const picker = useTemplateRef<{ inputRef?: HTMLInputElement | null }>('picker')
const picked = shallowRef<File | File[] | null>(null)
const compact = computed<boolean>(
  () => !uploads.multiple.value && fieldProps.value.variant === 'button',
)

const unregisterUpload = form.registerFieldUpload(props.path, uploads.runtime)
onScopeDispose(unregisterUpload)

watch(picked, (value) => {
  const files = Array.isArray(value) ? value : value ? [value] : []
  if (files.length === 0) return
  picked.value = uploads.multiple.value ? [] : null
  void handleBlur()
  uploads.select(files)
})

watch(
  () => uploads.runtime.pending(),
  (pending) => {
    if (!pending) api.value.validation.clearError()
  },
)

function replace() {
  picker.value?.inputRef?.click()
}
</script>

<template>
  <FormFieldShell :field="field" :path="path">
    <div class="grid gap-2" :data-form-upload-busy="uploads.busy.value || undefined">
      <ul
        v-if="uploads.items.value.length"
        class="m-0 grid list-none gap-2 p-0"
        data-form-upload-list=""
      >
        <UploadItem
          v-for="item in uploads.items.value"
          :key="item.key"
          :item="item"
          :compact="compact"
          :disabled="disabled"
          :replaceable="!uploads.multiple.value"
          @open="uploads.open(item.key)"
          @start="uploads.start(item.key)"
          @cancel="uploads.cancel(item.key)"
          @retry="uploads.retry(item.key)"
          @remove="uploads.remove(item.key)"
          @replace="replace"
        />
      </ul>
      <UFileUpload
        ref="picker"
        v-model="picked"
        v-bind="controlProps"
        :class="uploads.canSelect.value ? 'w-full' : 'hidden'"
        :accept="fieldProps.accept"
        :multiple="uploads.multiple.value"
        :disabled="disabled || validationPending"
        :label="resolveFormText(fieldProps.dropzoneLabel) ?? t('form.fields.file.drop')"
        :description="resolveFormText(fieldProps.dropzoneDescription)"
        :icon="fieldProps.icon"
        :variant="fieldProps.variant"
        :layout="fieldProps.layout"
        :preview="false"
      />
    </div>
  </FormFieldShell>
</template>
