<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import { useObjectUrl } from '@vueuse/core'
import { computed, onMounted } from 'vue'

import { useUiToolsLocale } from '../../../i18n/use-locale'
import { useFilePreviewShell } from '../../composables/use-file-preview-shell'
import type { FilePreviewRendererEmits, FilePreviewRendererProps } from '../../types'
import FilePreviewMessage from '../shell/file-preview-message.vue'

const props = defineProps<FilePreviewRendererProps>()
const emit = defineEmits<FilePreviewRendererEmits>()

const { t } = useUiToolsLocale()
const shell = useFilePreviewShell()
/** Android browsers and some in-app webviews have no built-in PDF viewer. */
const inline = globalThis.navigator?.pdfViewerEnabled !== false
/**
 * Blob sources are re-typed as PDF before they get an object URL, so a blob the server labelled as
 * HTML can never be rendered as a page inside the frame.
 */
const typed = computed(() =>
  props.blob ? new Blob([props.blob], { type: 'application/pdf' }) : null,
)
const objectUrl = useObjectUrl(typed)
const source = computed(() => {
  const base = objectUrl.value ?? props.url
  if (base.includes('#')) return base
  const page = shell.options.pdf?.page
  return `${base}#${page ? `page=${page}&` : ''}view=FitH`
})

function openInTab() {
  window.open(props.url, '_blank', 'noopener')
}

onMounted(() => {
  if (!inline) emit('ready')
})
</script>

<template>
  <iframe
    v-if="inline"
    :src="source"
    :title="file.name"
    class="absolute inset-0 size-full border-0 bg-(--nut-fp-document)"
    data-file-preview-pdf=""
    @load="emit('ready')"
  />
  <FilePreviewMessage
    v-else
    icon="i-lucide-file-text"
    badge="PDF"
    :title="t('filePreview.errors.pdfTitle')"
    :description="t('filePreview.errors.pdfDescription')"
  >
    <UButton
      icon="i-lucide-external-link"
      :label="t('filePreview.errors.open')"
      @click="openInTab"
    />
  </FilePreviewMessage>
</template>
