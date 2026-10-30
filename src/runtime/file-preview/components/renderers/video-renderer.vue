<script setup lang="ts">
import { useTemplateRef } from 'vue'

import { useUiToolsLocale } from '../../../i18n/use-locale'
import VideoPlayer from '../../../media/components/video-player.vue'
import { onFilePreviewKey, useFilePreviewShell } from '../../composables/use-file-preview-shell'
import type { FilePreviewRendererEmits, FilePreviewRendererProps } from '../../types'
import { formatFilePreviewDuration } from '../../utils/format'

defineProps<FilePreviewRendererProps>()
const emit = defineEmits<FilePreviewRendererEmits>()

const { t } = useUiToolsLocale()
const shell = useFilePreviewShell()
const player = useTemplateRef<InstanceType<typeof VideoPlayer>>('player')

function handleReady(metadata: { duration: number; width: number; height: number }) {
  emit('ready', [
    {
      label: t('filePreview.fields.duration'),
      value: formatFilePreviewDuration(metadata.duration),
    },
    {
      label: t('filePreview.fields.dimensions'),
      value: `${metadata.width} × ${metadata.height} px`,
    },
  ])
}

function handleError(error: { message?: string }) {
  emit('error', { message: error.message, reason: 'decode' })
}

onFilePreviewKey([' ', 'k', 'm', 'f'], (event) => {
  if (event.key === 'm') player.value?.toggleMute()
  else if (event.key === 'f') player.value?.toggleFullscreen()
  else player.value?.toggle()
})
</script>

<template>
  <VideoPlayer
    ref="player"
    :src="url"
    :poster="file.file.poster"
    :tracks="file.file.tracks"
    :keyboard="false"
    :compact="shell.narrow.value"
    class="absolute inset-0"
    data-file-preview-video=""
    @ready="handleReady"
    @error="handleError"
  />
</template>
