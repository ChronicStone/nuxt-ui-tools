<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'
import { useMediaControls } from '@vueuse/core'
import { computed, useTemplateRef } from 'vue'

import { useUiToolsLocale } from '../../../i18n/use-locale'
import { onFilePreviewKey } from '../../composables/use-file-preview-shell'
import type { FilePreviewRendererEmits, FilePreviewRendererProps } from '../../types'
import { formatFilePreviewDuration } from '../../utils/format'
import MediaControls from './media-controls.vue'

/** Heights of the decorative equalizer bars on the cover. */
const BARS = Array.from(
  { length: 28 },
  (_, index) => 18 + Math.abs(Math.sin(index * 1.3) * Math.cos(index * 0.4)) * 62,
)

defineProps<FilePreviewRendererProps>()
const emit = defineEmits<FilePreviewRendererEmits>()

const { t } = useUiToolsLocale()
const audio = useTemplateRef<HTMLAudioElement>('audio')
const controls = useMediaControls(audio)
const duration = computed(() =>
  controls.duration.value > 0 ? formatFilePreviewDuration(controls.duration.value) : null,
)

function handleMetadata() {
  const element = audio.value
  if (!element) return
  emit('ready', [
    { label: t('filePreview.fields.duration'), value: formatFilePreviewDuration(element.duration) },
  ])
}

onFilePreviewKey([' ', 'k', 'm'], (event) => {
  if (event.key === 'm') controls.muted.value = !controls.muted.value
  else controls.playing.value = !controls.playing.value
})
</script>

<template>
  <div class="flex size-full items-center justify-center p-5" data-file-preview-audio="">
    <div class="flex w-full max-w-md flex-col gap-4">
      <div
        class="relative flex h-36 items-center justify-center gap-[3px] overflow-hidden rounded-xl bg-linear-135 from-[#3b2f4a] via-[#b8466e] to-primary px-6"
        aria-hidden="true"
      >
        <img
          v-if="file.file.poster"
          :src="file.file.poster"
          alt=""
          class="absolute inset-0 size-full object-cover"
        />
        <template v-else>
          <i
            v-for="(height, position) in BARS"
            :key="position"
            :class="[
              'block w-1 rounded-full bg-white/80',
              controls.playing.value ? 'nut-fp-equalizer' : '',
            ]"
            :style="{ height: `${height}px`, animationDelay: `${(position % 7) * -0.13}s` }"
          />
          <UIcon
            name="i-lucide-audio-lines"
            class="absolute right-3 bottom-3 size-4 text-white/70"
          />
        </template>
      </div>
      <div class="min-w-0">
        <p class="m-0 truncate text-sm font-semibold text-highlighted">{{ file.name }}</p>
        <p v-if="duration" class="m-0 text-xs text-muted tabular-nums">{{ duration }}</p>
      </div>
      <audio
        ref="audio"
        :src="url"
        preload="metadata"
        class="hidden"
        @loadedmetadata="handleMetadata"
        @error="emit('error', { reason: 'decode' })"
      />
      <MediaControls :controls="controls" variant="audio" compact />
    </div>
  </div>
</template>
