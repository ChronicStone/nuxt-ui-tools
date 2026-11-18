<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed, ref, useTemplateRef } from 'vue'

import { useUiToolsLocale } from '../../../i18n/use-locale'
import AudioPlayer from '../../../media/components/audio-player.vue'
import { onFilePreviewKey } from '../../composables/use-file-preview-shell'
import type { FilePreviewRendererEmits, FilePreviewRendererProps } from '../../types'
import { formatFilePreviewDuration } from '../../utils/format'

/** Heights of the decorative equalizer bars on the cover. */
const BARS = Array.from(
  { length: 28 },
  (_, index) => 18 + Math.abs(Math.sin(index * 1.3) * Math.cos(index * 0.4)) * 62,
)

defineProps<FilePreviewRendererProps>()
const emit = defineEmits<FilePreviewRendererEmits>()

const { t } = useUiToolsLocale()
const player = useTemplateRef<InstanceType<typeof AudioPlayer>>('player')
const seconds = ref(0)
const playing = ref(false)
const duration = computed(() =>
  seconds.value > 0 ? formatFilePreviewDuration(seconds.value) : null,
)

function handleReady(metadata: { duration: number }) {
  seconds.value = metadata.duration
  emit('ready', [
    {
      label: t('filePreview.fields.duration'),
      value: formatFilePreviewDuration(metadata.duration),
    },
  ])
}

onFilePreviewKey([' ', 'k', 'm'], (event) => {
  if (event.key === 'm') player.value?.toggleMute()
  else player.value?.toggle()
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
            :class="['block w-1 rounded-full bg-white/80', playing ? 'nut-fp-equalizer' : '']"
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
      <AudioPlayer
        ref="player"
        :src="url"
        :title="file.name"
        :keyboard="false"
        compact
        @ready="handleReady"
        @play="playing = true"
        @pause="playing = false"
        @error="emit('error', { reason: 'decode' })"
      />
    </div>
  </div>
</template>
