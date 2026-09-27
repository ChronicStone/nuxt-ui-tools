<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UDropdownMenu from '@nuxt/ui/components/DropdownMenu.vue'
import USlider from '@nuxt/ui/components/Slider.vue'
import type { useFullscreen, useMediaControls } from '@vueuse/core'
import { computed } from 'vue'

import { useUiToolsLocale } from '../../../i18n/use-locale'
import { formatFilePreviewDuration } from '../../utils/format'
import FilePreviewButton from '../shell/file-preview-button.vue'

const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2]

const props = defineProps<{
  controls: ReturnType<typeof useMediaControls>
  variant: 'video' | 'audio'
  fullscreen?: ReturnType<typeof useFullscreen> | null
  compact?: boolean
}>()

const { t } = useUiToolsLocale()
const tone = computed(() => (props.variant === 'video' ? 'inverted' : 'default'))
const time = computed(
  () =>
    `${formatFilePreviewDuration(props.controls.currentTime.value)} / ${formatFilePreviewDuration(props.controls.duration.value)}`,
)
const silent = computed(() => props.controls.muted.value || props.controls.volume.value === 0)
const captions = computed(() => props.controls.selectedTrack.value !== -1)
const sliderUi = computed(() =>
  props.variant === 'video'
    ? { range: 'bg-white', thumb: 'bg-white ring-white', track: 'bg-white/30' }
    : undefined,
)
const rates = computed(() =>
  RATES.map((rate) => ({
    checked: props.controls.rate.value === rate,
    label: `${rate}×`,
    onSelect: () => {
      props.controls.rate.value = rate
    },
    type: 'checkbox' as const,
  })),
)

function toggle() {
  props.controls.playing.value = !props.controls.playing.value
}

function seek(value: number | number[] | undefined) {
  const next = Array.isArray(value) ? value[0] : value
  if (next !== undefined) props.controls.currentTime.value = next
}

function setVolume(value: number | number[] | undefined) {
  const next = Array.isArray(value) ? value[0] : value
  if (next === undefined) return
  props.controls.volume.value = next
  props.controls.muted.value = next === 0
}

function toggleCaptions() {
  if (captions.value) props.controls.disableTrack()
  else props.controls.enableTrack(0)
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
      :icon="controls.playing.value ? 'i-lucide-pause' : 'i-lucide-play'"
      :label="controls.playing.value ? t('filePreview.media.pause') : t('filePreview.media.play')"
      :kbds="['space']"
      :tone="tone"
      data-file-preview-play=""
      @click="toggle"
    />
    <span class="shrink-0 px-1 text-xs whitespace-nowrap tabular-nums" data-file-preview-time="">
      {{ time }}
    </span>
    <USlider
      :model-value="controls.currentTime.value"
      :min="0"
      :max="Math.max(controls.duration.value, 0.1)"
      :step="0.1"
      size="xs"
      color="neutral"
      :aria-label="t('filePreview.media.seek')"
      :ui="sliderUi"
      class="mx-1.5 min-w-16 flex-1"
      @update:model-value="seek"
    />
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
    <UDropdownMenu :items="rates" :content="{ align: 'end', side: 'top' }">
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
      v-if="controls.tracks.value.length > 0"
      icon="i-lucide-captions"
      :label="t('filePreview.media.captions')"
      :pressed="captions"
      :tone="tone"
      @click="toggleCaptions"
    />
    <FilePreviewButton
      v-if="variant === 'video' && controls.supportsPictureInPicture"
      icon="i-lucide-picture-in-picture-2"
      :label="t('filePreview.media.pictureInPicture')"
      :tone="tone"
      @click="controls.togglePictureInPicture()"
    />
    <FilePreviewButton
      v-if="fullscreen?.isSupported.value"
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
