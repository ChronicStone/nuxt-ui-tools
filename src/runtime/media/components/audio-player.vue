<script setup lang="ts">
import { useElementSize } from '@vueuse/core'
import { computed, useTemplateRef, watch } from 'vue'

import { MEDIA_PLAYER_RATES, useMediaPlayback } from '../composables/use-media-playback'
import type { MediaPlayerControl, MediaPlayerDownload, MediaPlayerProgress } from '../types/media'
import MediaControls from './media-controls.vue'

const {
  src,
  title = undefined,
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
  /** Read by assistive technology as the player's name. */
  title?: string
  /** Space or K plays and pauses, M mutes while the player has focus. */
  keyboard?: boolean
  /** Drops the volume slider; by default the player compacts itself below 480 px. */
  compact?: boolean
  /** False turns the timeline into a progress bar: the listener cannot skip ahead or back. */
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
  ready: [metadata: { duration: number }]
  error: [error: { message?: string }]
  play: []
  pause: []
  /** The clip played to its end. */
  ended: []
  progress: [progress: MediaPlayerProgress]
  /** The download button was pressed while `download` is `true`. */
  download: []
}>()

const frame = useTemplateRef<HTMLElement>('frame')
const audio = useTemplateRef<HTMLAudioElement>('audio')
const playback = useMediaPlayback({
  element: audio,
  rules: () => ({ source: src, seekable, maxPlays, start, end, loop, disabled, autoplay }),
  models: { plays, rate, volume, muted },
  hooks: {
    onEnded: () => emit('ended'),
    onProgress: (progress) => emit('progress', progress),
  },
})
const { controls } = playback
const { width } = useElementSize(frame)
const narrow = computed(() => compact ?? (width.value > 0 && width.value < 480))

watch(controls.playing, (playing) => (playing ? emit('play') : emit('pause')))

function toggleMute() {
  controls.muted.value = !controls.muted.value
}

function handleMetadata() {
  const element = audio.value
  if (element) emit('ready', { duration: element.duration })
}

function handleError() {
  emit('error', { message: audio.value?.error?.message || undefined })
}

function handleKey(event: KeyboardEvent) {
  if (!keyboard || event.target !== frame.value) return
  if (event.key === 'm') toggleMute()
  else if (event.key === ' ' || event.key === 'k') playback.toggle()
  else return

  event.preventDefault()
}

defineExpose({
  controls,
  play: playback.play,
  pause: playback.pause,
  seek: playback.seek,
  toggle: playback.toggle,
  toggleMute,
})
</script>

<template>
  <div
    ref="frame"
    class="min-w-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
    :tabindex="keyboard ? 0 : undefined"
    :aria-label="title"
    role="region"
    data-audio-player=""
    @keydown="handleKey"
  >
    <audio
      ref="audio"
      :src="src"
      :title="title"
      :preload="preload"
      :crossorigin="crossorigin"
      :muted="muted"
      class="hidden"
      @loadedmetadata="handleMetadata"
      @error="handleError"
    />
    <MediaControls
      :playback="playback"
      :compact="narrow"
      :seekable="seekable"
      :rates="rates"
      :hide="hide"
      :download="download"
      @download="emit('download')"
      variant="audio"
    />
  </div>
</template>
