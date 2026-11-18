<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UDropdownMenu from '@nuxt/ui/components/DropdownMenu.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import USlider from '@nuxt/ui/components/Slider.vue'
import type { useFullscreen } from '@vueuse/core'
import { computed } from 'vue'

import FilePreviewButton from '../../file-preview/components/shell/file-preview-button.vue'
import { formatFilePreviewDuration } from '../../file-preview/utils/format'
import { useUiToolsLocale } from '../../i18n/use-locale'
import { MEDIA_PLAYER_RATES } from '../composables/use-media-playback'
import type { MediaPlayback } from '../composables/use-media-playback'
import type { MediaPlayerControl, MediaPlayerDownload } from '../types/media'

const {
  playback,
  variant,
  fullscreen = null,
  compact = false,
  seekable = true,
  rates = MEDIA_PLAYER_RATES,
  hide = [],
  download = undefined,
} = defineProps<{
  playback: MediaPlayback
  variant: 'video' | 'audio'
  fullscreen?: ReturnType<typeof useFullscreen> | null
  compact?: boolean
  seekable?: boolean
  rates?: readonly number[] | false
  hide?: readonly MediaPlayerControl[]
  /** A file to link to, or `true` for a button that emits `download` for the host to save. */
  download?: MediaPlayerDownload | true
}>()

const emit = defineEmits<{ download: [] }>()

const { t } = useUiToolsLocale()
const controls = computed(() => playback.controls)
const tone = computed(() => (variant === 'video' ? 'inverted' : 'default'))
const time = computed(
  () =>
    `${formatFilePreviewDuration(playback.position.value)} / ${formatFilePreviewDuration(playback.length.value)}`,
)
const percent = computed(() =>
  playback.length.value > 0 ? (playback.position.value / playback.length.value) * 100 : 0,
)
const silent = computed(() => controls.value.muted.value || controls.value.volume.value === 0)
const captions = computed(() => controls.value.selectedTrack.value !== -1)
const trackItems = computed(() => [
  {
    checked: !captions.value,
    label: t('filePreview.media.captionsOff'),
    onSelect: () => controls.value.disableTrack(),
    type: 'checkbox' as const,
  },
  ...controls.value.tracks.value.map((track, position) => ({
    checked: controls.value.selectedTrack.value === position,
    label: track.label,
    onSelect: () => controls.value.enableTrack(position),
    type: 'checkbox' as const,
  })),
])
/** The file the download button links to; `true` means the host saves it on `download`. */
const downloadLink = computed(() => (download && download !== true ? download : null))
/** Every play used: only the lock, the time and what explains it stay in the bar. */
const spent = computed(() => playback.locked.value)
const sliderUi = computed(() =>
  variant === 'video'
    ? { range: 'bg-white', thumb: 'bg-white ring-white', track: 'bg-white/30' }
    : undefined,
)
const rateItems = computed(() =>
  (rates || []).map((rate) => ({
    checked: controls.value.rate.value === rate,
    label: `${rate}×`,
    onSelect: () => {
      controls.value.rate.value = rate
    },
    type: 'checkbox' as const,
  })),
)
const playsLeft = computed(() => {
  const remaining = playback.remaining.value
  if (remaining === null || playback.active.value) return null
  if (remaining === 0) return t('filePreview.media.locked')
  if (compact) return String(remaining)

  return remaining === 1
    ? t('filePreview.media.playsLeftOne')
    : t('filePreview.media.playsLeft', { count: remaining })
})

function shown(control: MediaPlayerControl) {
  return !hide.includes(control)
}

function seek(value: number | number[] | undefined) {
  const next = Array.isArray(value) ? value[0] : value
  if (next !== undefined) playback.seek(next)
}

function setVolume(value: number | number[] | undefined) {
  const next = Array.isArray(value) ? value[0] : value
  if (next === undefined) return
  controls.value.volume.value = next
  controls.value.muted.value = next === 0
}

function toggleCaptions() {
  if (captions.value) controls.value.disableTrack()
  else controls.value.enableTrack(0)
}
</script>

<template>
  <div
    :class="[
      'flex items-center gap-1',
      variant === 'video'
        ? 'bg-linear-to-t from-black/75 via-black/40 to-transparent px-2.5 pt-10 pb-2 text-white'
        : 'rounded-full border border-default bg-elevated py-1 ps-1 pe-2 text-toned',
    ]"
    data-file-preview-media-controls=""
  >
    <FilePreviewButton
      :icon="
        playback.locked.value
          ? 'i-lucide-lock'
          : controls.playing.value
            ? 'i-lucide-pause'
            : 'i-lucide-play'
      "
      :label="
        playback.locked.value
          ? t('filePreview.media.locked')
          : controls.playing.value
            ? t('filePreview.media.pause')
            : t('filePreview.media.play')
      "
      :kbds="['space']"
      :tone="tone"
      :disabled="!controls.playing.value && !playback.playable.value"
      data-file-preview-play=""
      @click="playback.toggle()"
    />
    <span
      v-if="shown('time')"
      class="shrink-0 px-1 text-xs whitespace-nowrap tabular-nums"
      data-file-preview-time=""
    >
      {{ time }}
    </span>
    <USlider
      v-if="!spent && seekable"
      :model-value="playback.position.value"
      :min="0"
      :max="Math.max(playback.length.value, 0.1)"
      :step="0.1"
      size="xs"
      color="neutral"
      :aria-label="t('filePreview.media.seek')"
      :ui="sliderUi"
      class="mx-1.5 min-w-16 flex-1"
      @update:model-value="seek"
    />
    <div
      v-else-if="!spent"
      role="progressbar"
      :aria-label="t('filePreview.media.progress')"
      :aria-valuenow="Math.round(percent)"
      aria-valuemin="0"
      aria-valuemax="100"
      :class="[
        'relative mx-1.5 h-1.5 min-w-16 flex-1 overflow-hidden rounded-full',
        variant === 'video' ? 'bg-white/30' : 'bg-accented',
      ]"
      data-media-progress=""
    >
      <span
        :class="[
          'absolute inset-y-0 start-0 rounded-full transition-[width] duration-200 ease-linear motion-reduce:transition-none',
          variant === 'video' ? 'bg-white' : 'bg-inverted',
        ]"
        :style="{ width: `${percent}%` }"
      />
    </div>
    <span
      v-if="playsLeft"
      :class="[
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap tabular-nums',
        spent ? 'min-w-0 flex-1 justify-center' : compact ? 'shrink-0' : 'min-w-0 shrink',
        variant === 'video' ? 'bg-white/15 text-white' : 'bg-accented text-toned',
      ]"
      :title="
        compact && !spent
          ? playback.remaining.value === 1
            ? t('filePreview.media.playsLeftOne')
            : t('filePreview.media.playsLeft', { count: playback.remaining.value ?? 0 })
          : undefined
      "
      data-media-plays-left=""
    >
      <UIcon v-if="compact && !spent" name="i-lucide-repeat" class="size-3 shrink-0" />
      <span class="truncate">{{ playsLeft }}</span>
    </span>
    <template v-if="shown('volume') && !spent">
      <FilePreviewButton
        :icon="silent ? 'i-lucide-volume-x' : 'i-lucide-volume-2'"
        :label="silent ? t('filePreview.media.unmute') : t('filePreview.media.mute')"
        :kbds="['M']"
        :tone="tone"
        @click="controls.muted.value = !controls.muted.value"
      />
      <USlider
        v-if="!compact"
        :model-value="silent ? 0 : controls.volume.value"
        :min="0"
        :max="1"
        :step="0.05"
        size="xs"
        color="neutral"
        :aria-label="t('filePreview.media.volume')"
        :ui="sliderUi"
        class="w-16 shrink-0"
        @update:model-value="setVolume"
      />
    </template>
    <UDropdownMenu
      v-if="shown('rate') && !spent && rateItems.length > 1"
      :items="rateItems"
      :content="{ align: 'end', side: 'top' }"
    >
      <UButton
        :label="`${controls.rate.value}×`"
        :aria-label="t('filePreview.media.speed')"
        color="neutral"
        variant="ghost"
        size="sm"
        :class="[
          'min-w-10 shrink-0 justify-center text-xs tabular-nums',
          variant === 'video' ? 'text-white hover:bg-white/15 hover:text-white' : 'text-muted',
        ]"
      />
    </UDropdownMenu>
    <FilePreviewButton
      v-if="shown('captions') && !spent && controls.tracks.value.length === 1"
      icon="i-lucide-captions"
      :label="t('filePreview.media.captions')"
      :pressed="captions"
      :tone="tone"
      @click="toggleCaptions"
    />
    <UDropdownMenu
      v-else-if="shown('captions') && !spent && controls.tracks.value.length > 1"
      :items="trackItems"
      :content="{ align: 'end', side: 'top' }"
    >
      <FilePreviewButton
        icon="i-lucide-captions"
        :label="t('filePreview.media.captions')"
        :pressed="captions"
        :tone="tone"
        data-media-captions-menu=""
      />
    </UDropdownMenu>
    <FilePreviewButton
      v-if="download === true && shown('download')"
      icon="i-lucide-download"
      :label="t('filePreview.media.download')"
      :tone="tone"
      data-media-download=""
      @click="emit('download')"
    />
    <FilePreviewButton
      v-else-if="downloadLink && shown('download')"
      icon="i-lucide-download"
      :label="t('filePreview.media.download')"
      :to="downloadLink.url"
      :download="downloadLink.fileName ?? true"
      external
      :tone="tone"
      data-media-download=""
    />
    <FilePreviewButton
      v-if="
        variant === 'video' &&
        !spent &&
        shown('pictureInPicture') &&
        seekable &&
        controls.supportsPictureInPicture
      "
      icon="i-lucide-picture-in-picture-2"
      :label="t('filePreview.media.pictureInPicture')"
      :tone="tone"
      @click="controls.togglePictureInPicture()"
    />
    <FilePreviewButton
      v-if="shown('fullscreen') && fullscreen?.isSupported.value"
      :icon="fullscreen.isFullscreen.value ? 'i-lucide-minimize' : 'i-lucide-maximize'"
      :label="
        fullscreen.isFullscreen.value
          ? t('filePreview.media.exitFullscreen')
          : t('filePreview.media.fullscreen')
      "
      :kbds="['F']"
      :tone="tone"
      @click="fullscreen.toggle()"
    />
  </div>
</template>
