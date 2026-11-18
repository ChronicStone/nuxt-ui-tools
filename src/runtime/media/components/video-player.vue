<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'
import { useElementSize, useFullscreen, useTimeoutFn } from '@vueuse/core'
import { computed, ref, useTemplateRef, watch } from 'vue'

import { useUiToolsLocale } from '../../i18n/use-locale'
import { MEDIA_PLAYER_RATES, useMediaPlayback } from '../composables/use-media-playback'
import type {
  MediaPlayerControl,
  MediaPlayerDownload,
  MediaPlayerProgress,
  VideoPlayerTrack,
} from '../types/media'
import MediaControls from './media-controls.vue'

const {
  src,
  poster = undefined,
  title = undefined,
  tracks = [],
  keyboard = true,
  compact = undefined,
  seekable = true,
  maxPlays = 0,
  start = undefined,
  end = undefined,
  rates = MEDIA_PLAYER_RATES,
  hide = [],
  download = undefined,
  autoplay = false,
  loop = false,
  preload = 'metadata',
  crossorigin = undefined,
  disabled = false,
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
  /** False turns the timeline into a progress bar: the viewer cannot skip ahead or back. */
  seekable?: boolean
  /** Plays allowed, each counted when playback starts from the clip start; 0 means no limit. */
  maxPlays?: number
  /** Clip start, in seconds into the file. Playback starts there. */
  start?: number
  /** Clip end, in seconds into the file. Playback stops there and counts as ended. */
  end?: number
  /** Speeds the speed menu offers; `false` removes the menu. */
  rates?: readonly number[] | false
  /** Controls to remove from the bar. */
  hide?: readonly MediaPlayerControl[]
  /** A download button: a file to link to, or `true` to emit `download` and let the host save it. */
  download?: MediaPlayerDownload | true
  /** Starts playing once the file is ready; browsers only allow it muted. */
  autoplay?: boolean
  /** Restarts the clip when it ends; each restart counts as a play. */
  loop?: boolean
  preload?: 'none' | 'metadata' | 'auto'
  crossorigin?: '' | 'anonymous' | 'use-credentials'
  /** Shows the player but refuses to play. */
  disabled?: boolean
}>()

/** Plays used so far; bind it to keep the count across mounts, e.g. in session storage. */
const plays = defineModel<number>('plays', { default: 0 })
const rate = defineModel<number>('rate', { default: 1 })
const volume = defineModel<number>('volume', { default: 1 })
const muted = defineModel<boolean>('muted', { default: false })

const emit = defineEmits<{
  ready: [metadata: { duration: number; width: number; height: number }]
  error: [error: { message?: string }]
  play: []
  pause: []
  /** The clip played to its end. */
  ended: []
  progress: [progress: MediaPlayerProgress]
  /** The download button was pressed while `download` is `true`. */
  download: []
}>()

defineSlots<{
  /** Replaces the title over the poster. */
  caption?: () => unknown
  /** Shown over the video instead of the start button once every play is used. */
  locked?: () => unknown
  /** Host content over the video, under the controls. */
  overlay?: () => unknown
}>()

const { t } = useUiToolsLocale()
const frame = useTemplateRef<HTMLElement>('frame')
const video = useTemplateRef<HTMLVideoElement>('video')
const playback = useMediaPlayback({
  element: video,
  rules: () => ({ source: src, seekable, maxPlays, start, end, loop, disabled, autoplay }),
  models: { plays, rate, volume, muted },
  hooks: {
    onEnded: () => emit('ended'),
    onProgress: (progress) => emit('progress', progress),
  },
  tracks: () =>
    tracks.map((track) => ({
      default: track.default,
      kind: track.kind ?? 'subtitles',
      label: track.label,
      src: track.src,
      srcLang: track.srcLang,
    })),
})
const { controls } = playback
const fullscreen = useFullscreen(frame)
const { width } = useElementSize(frame)
const awake = ref(true)
const rest = useTimeoutFn(() => (awake.value = false), 2500)
const showControls = computed(() => !controls.playing.value || awake.value)
const narrow = computed(() => compact ?? (width.value > 0 && width.value < 480))
const startLabel = computed(() => {
  const remaining = playback.remaining.value
  if (remaining === null) return null

  return remaining === 1
    ? t('filePreview.media.playsLeftOne')
    : t('filePreview.media.playsLeft', { count: remaining })
})

watch(controls.playing, (playing) => (playing ? emit('play') : emit('pause')))

function wake() {
  awake.value = true
  rest.start()
}

function toggle() {
  playback.toggle()
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

defineExpose({
  controls,
  fullscreen,
  play: playback.play,
  pause: playback.pause,
  seek: playback.seek,
  toggle,
  toggleMute,
  toggleFullscreen,
})
</script>

<template>
  <div
    ref="frame"
    :class="[
      'group/video relative min-w-0 overflow-hidden bg-black outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
      showControls ? '' : 'cursor-none',
    ]"
    :tabindex="keyboard ? 0 : undefined"
    :aria-label="title"
    role="region"
    data-video-player=""
    :data-controls-shown="
      playback.started.value && !playback.locked.value && showControls ? '' : undefined
    "
    @pointermove="wake"
    @keydown="handleKey"
  >
    <video
      ref="video"
      :src="src"
      :poster="poster"
      :title="title"
      :preload="preload"
      :crossorigin="crossorigin"
      :muted="muted"
      playsinline
      :disablepictureinpicture="!seekable"
      class="size-full object-contain"
      @click="toggle"
      @dblclick="toggleFullscreen"
      @contextmenu="playback.restricted.value && $event.preventDefault()"
      @loadedmetadata="handleMetadata"
      @error="handleError"
    />

    <slot name="overlay" />

    <Transition
      enter-active-class="transition duration-200 ease-out motion-reduce:transition-none"
      enter-from-class="opacity-0"
      leave-active-class="transition duration-150 ease-in motion-reduce:transition-none"
      leave-to-class="opacity-0"
    >
      <div
        v-if="playback.locked.value"
        class="absolute inset-0 grid place-items-center bg-black/70 px-6 text-center text-white"
        data-video-player-locked=""
      >
        <slot name="locked">
          <span class="grid justify-items-center gap-3">
            <span class="grid size-14 place-items-center rounded-full bg-white/12">
              <UIcon name="i-lucide-lock" class="size-6" />
            </span>
            <span class="text-sm font-medium">{{ t('filePreview.media.locked') }}</span>
          </span>
        </slot>
      </div>
      <button
        v-else-if="!playback.started.value"
        type="button"
        class="absolute inset-0 grid place-items-center bg-linear-to-t from-black/45 via-black/10 to-transparent text-white disabled:cursor-not-allowed"
        :aria-label="t('filePreview.media.play')"
        :disabled="disabled"
        data-video-player-start=""
        @click="toggle"
      >
        <span
          :class="[
            'grid size-16 place-items-center rounded-full bg-white/95 ps-1 text-black shadow-[0_12px_32px_-12px_rgba(0,0,0,0.6)] transition duration-200 ease-out motion-reduce:transition-none',
            disabled ? 'opacity-60' : 'group-hover/video:scale-105',
          ]"
        >
          <UIcon name="i-lucide-play" class="size-7 fill-current" />
        </span>
        <span
          v-if="startLabel"
          class="absolute top-3 end-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium tabular-nums backdrop-blur-sm"
          data-video-player-plays=""
        >
          {{ startLabel }}
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
      v-if="playback.started.value && controls.waiting.value"
      class="pointer-events-none absolute top-1/2 left-1/2 size-10 -translate-1/2 animate-spin rounded-full border-2 border-white/30 border-t-white"
      aria-hidden="true"
    />

    <MediaControls
      v-if="playback.started.value && !playback.locked.value"
      :class="[
        'absolute inset-x-0 bottom-0 transition-opacity duration-200 motion-reduce:transition-none',
        showControls ? 'opacity-100' : 'pointer-events-none opacity-0',
      ]"
      :playback="playback"
      :fullscreen="fullscreen"
      :compact="narrow"
      :seekable="seekable"
      :rates="rates"
      :hide="hide"
      :download="download"
      @download="emit('download')"
      variant="video"
    />
  </div>
</template>

<style scoped>
/* Captions rise above the control bar while it shows, instead of sitting under it. */
video::-webkit-media-text-track-container {
  transition: transform 200ms ease-out;
}

[data-controls-shown] video::-webkit-media-text-track-container {
  transform: translateY(-3.5rem);
}

@media (prefers-reduced-motion: reduce) {
  video::-webkit-media-text-track-container {
    transition: none;
  }
}
</style>
