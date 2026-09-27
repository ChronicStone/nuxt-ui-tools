<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import { computed, onMounted } from 'vue'

import { useUiToolsLocale } from '../../../i18n/use-locale'
import { useFilePreview } from '../../composables/use-file-preview-api'
import type { FilePreviewRendererEmits, FilePreviewRendererProps } from '../../types'
import { downloadFilePreviewItem } from '../../utils/download'
import { findFilePreviewRenderer } from '../../utils/renderers'
import FilePreviewMessage from '../shell/file-preview-message.vue'

const props = defineProps<FilePreviewRendererProps>()
const emit = defineEmits<FilePreviewRendererEmits>()

const { t } = useUiToolsLocale()
const api = useFilePreview()
const icon = computed(() => findFilePreviewRenderer(props.file.kind, api.renderers.value).icon)
const extension = computed(() => props.file.extension?.toUpperCase() ?? null)

onMounted(() => emit('ready'))
</script>

<template>
  <FilePreviewMessage
    :icon="icon"
    :badge="extension"
    :title="t('filePreview.fallback.title')"
    :description="
      extension
        ? t('filePreview.fallback.description', { extension })
        : t('filePreview.fallback.descriptionUnnamed')
    "
    data-file-preview-fallback=""
  >
    <UButton
      v-if="file.file.download !== false"
      icon="i-lucide-download"
      :label="t('filePreview.download')"
      data-file-preview-download=""
      @click="downloadFilePreviewItem(file)"
    />
  </FilePreviewMessage>
</template>
