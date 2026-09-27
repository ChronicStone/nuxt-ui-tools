<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'
import { useFullscreen, useMediaControls, useTimeoutFn } from '@vueuse/core'
import { computed, ref, useTemplateRef } from 'vue'

import { useUiToolsLocale } from '../../../i18n/use-locale'
import { onFilePreviewKey, useFilePreviewShell } from '../../composables/use-file-preview-shell'
import type { FilePreviewRendererEmits, FilePreviewRendererProps } from '../../types'
import { formatFilePreviewDuration } from '../../utils/format'
import MediaControls from './media-controls.vue'

const props = defineProps<FilePreviewRendererProps>()
const emit = defineEmits<FilePreviewRendererEmits>()

const { t } = useUiToolsLocale()
const shell = useFilePreviewShell()
const frame = useTemplateRef<HTMLElement>('frame')
const video = useTemplateRef<HTMLVideoElement>('video')
const controls = useMediaControls(video, {
  tracks: () =>
    (props.file.file.tracks ?? []).map((track) => ({
      default: track.default,
      kind: track.kind ?? 'subtitles',
      label: track.label,
      src: track.src,
      srcLang: track.srcLang,
    })),
})
const fullscreen = useFullscreen(frame)
const active = ref<boolean>(true)
const rest = useTimeoutFn(() => (active.value = false), 2500)
const started = computed(() => controls.playing.value || controls.currentTime.value > 0.05)
const showControls = computed(() => !controls.playing.value || active.value)

function wake() {
  active.value = true
  rest.start()
}

function toggle() {
  controls.playing.value = !controls.playing.value
  wake()
}

function handleMetadata() {
  const element = video.value
  if (!element) return
  emit('ready', [
    { label: t('filePreview.fields.duration'), value: formatFilePreviewDuration(element.duration) },
    {
      label: t('filePreview.fields.dimensions'),
      value: `${element.videoWidth} × ${element.videoHeight} px`,
    },
  ])
}

function handleError() {
  emit('error', { message: video.value?.error?.message || undefined, reason: 'decode' })
}

onFilePreviewKey([' ', 'k', 'm', 'f'], (event) => {
  if (event.key === 'm') controls.muted.value = !controls.muted.value
  else if (event.key === 'f') void fullscreen.toggle()
  else toggle()
})
</script>

<template>
  <div
    ref="frame"
    :class="['absolute inset-0 overflow-hidden bg-black', showControls ? '' : 'cursor-none']"
    data-file-preview-video=""
    @pointermove="wake"
  >
    <video
      ref="video"
      :src="url"
      :poster="file.file.poster"
      preload="metadata"
      playsinline
      class="size-full object-contain"
      @click="toggle"
      @dblclick="fullscreen.toggle()"
      @loadedmetadata="handleMetadata"
      @error="handleError"
    />

    <button
      v-if="!started"
      type="button"
      class="absolute top-1/2 left-1/2 grid size-17 -translate-1/2 place-items-center rounded-full bg-black/55 ps-1 text-white transition hover:bg-black/70"
      :aria-label="t('filePreview.media.play')"
      data-file-preview-big-play=""
      @click="toggle"
    >
      <UIcon name="i-lucide-play" class="size-7" />
    </button>
    <span
      v-else-if="controls.waiting.value"
      class="pointer-events-none absolute top-1/2 left-1/2 size-10 -translate-1/2 animate-spin rounded-full border-2 border-white/30 border-t-white"
      aria-hidden="true"
    />

    <MediaControls
      :class="[
        'absolute inset-x-0 bottom-0 transition-opacity duration-200 motion-reduce:transition-none',
        showControls ? 'opacity-100' : 'pointer-events-none opacity-0',
      ]"
      :controls="controls"
      :fullscreen="fullscreen"
      :compact="shell.narrow.value"
      variant="video"
    />
  </div>
</template>
