<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'
import { useElementSize, useFullscreen, useMediaControls, useTimeoutFn } from '@vueuse/core'
import { computed, ref, useTemplateRef, watch } from 'vue'

import { useUiToolsLocale } from '../../i18n/use-locale'
import type { VideoPlayerTrack } from '../types/media'
import MediaControls from './media-controls.vue'

const {
  src,
  poster = undefined,
  title = undefined,
  tracks = [],
  keyboard = true,
  compact = undefined,
} = defineProps<{
  src: string
  poster?: string
  /** Read by assistive technology, and shown over the poster before playback starts. */
  title?: string
  tracks?: readonly VideoPlayerTrack[]
  /** Space or K plays and pauses, M mutes, F toggles full screen while the player has focus. */
  keyboard?: boolean
  /** Drops the volume slider; by default the player compacts itself below 480 px. */
  compact?: boolean
}>()

const emit = defineEmits<{
  ready: [metadata: { duration: number; width: number; height: number }]
  error: [error: { message?: string }]
  play: []
  pause: []
  ended: []
}>()

const { t } = useUiToolsLocale()
const frame = useTemplateRef<HTMLElement>('frame')
const video = useTemplateRef<HTMLVideoElement>('video')
const controls = useMediaControls(video, {
  tracks: () =>
    tracks.map((track) => ({
      default: track.default,
      kind: track.kind ?? 'subtitles',
      label: track.label,
      src: track.src,
      srcLang: track.srcLang,
    })),
})
const fullscreen = useFullscreen(frame)
const { width } = useElementSize(frame)
const active = ref(true)
const rest = useTimeoutFn(() => (active.value = false), 2500)
const started = computed(() => controls.playing.value || controls.currentTime.value > 0.05)
const showControls = computed(() => !controls.playing.value || active.value)
const narrow = computed(() => compact ?? (width.value > 0 && width.value < 480))

watch(controls.playing, (playing) => (playing ? emit('play') : emit('pause')))
watch(controls.ended, (ended) => ended && emit('ended'))

function wake() {
  active.value = true
  rest.start()
}

function toggle() {
  controls.playing.value = !controls.playing.value
  wake()
}

function toggleMute() {
  controls.muted.value = !controls.muted.value
  wake()
}

function toggleFullscreen() {
  void fullscreen.toggle()
}

function handleMetadata() {
  const element = video.value
  if (!element) return

  emit('ready', {
    duration: element.duration,
    width: element.videoWidth,
    height: element.videoHeight,
  })
}

function handleError() {
  emit('error', { message: video.value?.error?.message || undefined })
}

function handleKey(event: KeyboardEvent) {
  if (!keyboard || event.target !== frame.value) return
  if (event.key === 'm') toggleMute()
  else if (event.key === 'f') toggleFullscreen()
  else if (event.key === ' ' || event.key === 'k') toggle()
  else return

  event.preventDefault()
}

defineExpose({ controls, fullscreen, toggle, toggleMute, toggleFullscreen })
</script>

<template>
  <div
    ref="frame"
    :class="[
      'group/video relative overflow-hidden bg-black outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
      showControls ? '' : 'cursor-none',
    ]"
    :tabindex="keyboard ? 0 : undefined"
    :aria-label="title"
    role="region"
    data-video-player=""
    @pointermove="wake"
    @keydown="handleKey"
  >
    <video
      ref="video"
      :src="src"
      :poster="poster"
      :title="title"
      preload="metadata"
      playsinline
      class="size-full object-contain"
      @click="toggle"
      @dblclick="toggleFullscreen"
      @loadedmetadata="handleMetadata"
      @error="handleError"
    />

    <Transition
      enter-active-class="transition duration-200 ease-out motion-reduce:transition-none"
      enter-from-class="opacity-0"
      leave-active-class="transition duration-150 ease-in motion-reduce:transition-none"
      leave-to-class="opacity-0"
    >
      <button
        v-if="!started"
        type="button"
        class="absolute inset-0 grid place-items-center bg-linear-to-t from-black/45 via-black/10 to-transparent text-white"
        :aria-label="t('filePreview.media.play')"
        data-video-player-start=""
        @click="toggle"
      >
        <span
          class="grid size-16 place-items-center rounded-full bg-white/95 ps-1 text-black shadow-[0_12px_32px_-12px_rgba(0,0,0,0.6)] transition duration-200 ease-out group-hover/video:scale-105 motion-reduce:transition-none"
        >
          <UIcon name="i-lucide-play" class="size-7 fill-current" />
        </span>
        <span
          v-if="title || $slots.caption"
          class="absolute inset-x-0 bottom-0 truncate px-5 pb-4 text-start text-sm font-medium text-white/95"
        >
          <slot name="caption">{{ title }}</slot>
        </span>
      </button>
    </Transition>
    <span
      v-if="started && controls.waiting.value"
      class="pointer-events-none absolute top-1/2 left-1/2 size-10 -translate-1/2 animate-spin rounded-full border-2 border-white/30 border-t-white"
      aria-hidden="true"
    />

    <MediaControls
      v-if="started"
      :class="[
        'absolute inset-x-0 bottom-0 transition-opacity duration-200 motion-reduce:transition-none',
        showControls ? 'opacity-100' : 'pointer-events-none opacity-0',
      ]"
      :controls="controls"
      :fullscreen="fullscreen"
      :compact="narrow"
      variant="video"
    />
  </div>
</template>
