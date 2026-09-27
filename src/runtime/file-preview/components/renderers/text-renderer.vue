<script setup lang="ts">
import { computed, watch } from 'vue'

import { useUiToolsLocale } from '../../../i18n/use-locale'
import { useFilePreviewText } from '../../composables/use-file-preview-text'
import type { FilePreviewRendererEmits, FilePreviewRendererProps } from '../../types'
import FilePreviewCode from './file-preview-code.vue'
import FilePreviewTextLoading from './file-preview-text-loading.vue'

const props = defineProps<FilePreviewRendererProps>()
const emit = defineEmits<FilePreviewRendererEmits>()

const { t } = useUiToolsLocale()
const content = useFilePreviewText(props)
const json = computed(
  () =>
    ['json', 'jsonc'].includes(props.file.extension ?? '') ||
    Boolean(props.file.mime?.includes('json')),
)
const facts = computed(() => (content.notice.value ? [content.notice.value] : []))

watch(
  content.status,
  (status) => {
    if (status === 'error')
      emit('error', { message: content.error.value?.message, reason: 'source' })
    if (status !== 'ready') return
    const lines = content.text.value.split(/\r?\n/u).length
    emit('ready', [{ label: t('filePreview.fields.lines'), value: lines.toLocaleString() }])
  },
  { immediate: true },
)
</script>

<template>
  <FilePreviewCode
    v-if="content.status.value === 'ready'"
    :text="content.text.value"
    :json="json"
    :facts="facts"
  />
  <FilePreviewTextLoading v-else />
</template>
