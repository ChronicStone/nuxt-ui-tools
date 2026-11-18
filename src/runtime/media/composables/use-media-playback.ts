import { useEventListener, useMediaControls } from '@vueuse/core'
import type { UseMediaTextTrackSource } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import type { MaybeRefOrGetter, Ref } from 'vue'
import { toValue } from 'vue'

import type { MediaPlayerProgress } from '../types/media'

/** Speeds offered when the host does not pass `rates`. */
export const MEDIA_PLAYER_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2] as const

/** Seconds of drift tolerated before a seek counts as the viewer moving the playhead. */
const SEEK_TOLERANCE = 0.75

interface MediaPlaybackRules {
  seekable: boolean
  maxPlays: number
  start: number | undefined
  end: number | undefined
  loop: boolean
  disabled: boolean
  autoplay: boolean
}

interface MediaPlaybackModels {
  plays: Ref<number>
  rate: Ref<number>
  volume: Ref<number>
  muted: Ref<boolean>
}

interface MediaPlaybackHooks {
  onEnded: () => void
  onProgress: (progress: MediaPlayerProgress) => void
}

/**
 * The rules both players enforce on a media element: the clip between `start` and `end`, the
 * play limit, the locked timeline, and the two-way sync of rate, volume and mute with the host.
 */
export function useMediaPlayback(options: {
  element: Ref<HTMLMediaElement | null | undefined>
  rules: () => MediaPlaybackRules
  models: MediaPlaybackModels
  hooks: MediaPlaybackHooks
  tracks?: MaybeRefOrGetter<UseMediaTextTrackSource[]>
}) {
  const { element, rules, models, hooks } = options
  const controls = useMediaControls(element, {
    tracks: () => (options.tracks ? toValue(options.tracks) : []),
  })
  /** A play is in progress: started from the clip start and not ended yet. */
  const active = ref(false)
  /** Playback was started at least once since the source loaded. */
  const started = ref(false)
  /** Last position reached by playback or by one of our own moves; a locked timeline returns there. */
  let allowedTime = 0

  const clipStart = computed(() => Math.max(0, rules().start ?? 0))
  const clipEnd = computed(() => {
    const end = rules().end
    const duration = controls.duration.value

    if (end !== undefined && end > clipStart.value)
      return duration > 0 ? Math.min(end, duration) : end

    return duration
  })
  const length = computed(() => Math.max(0, clipEnd.value - clipStart.value))
  const position = computed(() =>
    Math.min(length.value, Math.max(0, controls.currentTime.value - clipStart.value)),
  )
  const limited = computed(() => rules().maxPlays > 0)
  const remaining = computed(() =>
    limited.value ? Math.max(0, rules().maxPlays - models.plays.value) : null,
  )
  const locked = computed(() => remaining.value === 0 && !active.value)
  const playable = computed(() => !rules().disabled && !locked.value)

  function moveTo(time: number) {
    const media = element.value
    if (!media) return

    allowedTime = time
    media.currentTime = time
    controls.currentTime.value = time
  }

  function play() {
    const media = element.value
    if (!media || !playable.value) return

    if (!active.value) {
      const outside =
        media.currentTime < clipStart.value - SEEK_TOLERANCE ||
        media.currentTime >= clipEnd.value - 0.05
      if (outside || !started.value) moveTo(clipStart.value)
      active.value = true
      models.plays.value += 1
    }

    started.value = true
    controls.playing.value = true
  }

  function pause() {
    controls.playing.value = false
  }

  function toggle() {
    if (controls.playing.value) pause()
    else play()
  }

  /** Moves to a position inside the clip; ignored when the timeline is locked. */
  function seek(seconds: number) {
    if (!rules().seekable) return

    moveTo(clipStart.value + Math.min(length.value, Math.max(0, seconds)))
  }

  function finish() {
    active.value = false
    controls.playing.value = false
    hooks.onEnded()

    if (rules().loop && !locked.value) {
      moveTo(clipStart.value)
      play()
    }
  }

  watch(controls.currentTime, (time) => {
    if (!element.value?.seeking) allowedTime = time

    hooks.onProgress({ position: position.value, length: length.value, currentTime: time })

    const end = rules().end
    if (active.value && end !== undefined && time >= clipEnd.value - 0.05) finish()
  })

  watch(controls.ended, (ended) => {
    if (ended && active.value) finish()
  })

  // A play started by the browser (media keys, picture-in-picture) goes through the same rules.
  watch(controls.playing, (playing) => {
    if (!playing) return
    if (!playable.value) controls.playing.value = false
    else if (!active.value) play()
  })

  watch(
    () => rules().disabled,
    (disabled) => disabled && pause(),
  )

  useEventListener(element, 'seeking', () => {
    const media = element.value
    if (!media) return

    const outside = media.currentTime < clipStart.value || media.currentTime > clipEnd.value
    const moved = Math.abs(media.currentTime - allowedTime) > SEEK_TOLERANCE

    if ((!rules().seekable && moved) || outside)
      moveTo(
        rules().seekable
          ? Math.min(clipEnd.value, Math.max(clipStart.value, media.currentTime))
          : allowedTime,
      )
  })

  useEventListener(element, 'loadedmetadata', () => {
    active.value = false
    started.value = false
    if (clipStart.value > 0) moveTo(clipStart.value)
    if (rules().autoplay) play()
  })

  watch(models.rate, (rate) => (controls.rate.value = rate), { immediate: true })
  watch(controls.rate, (rate) => (models.rate.value = rate))
  watch(models.volume, (volume) => (controls.volume.value = volume), { immediate: true })
  watch(controls.volume, (volume) => (models.volume.value = volume))
  watch(models.muted, (muted) => (controls.muted.value = muted), { immediate: true })
  watch(controls.muted, (muted) => (models.muted.value = muted))

  return {
    controls,
    started,
    active,
    position,
    length,
    remaining,
    locked,
    playable,
    play,
    pause,
    toggle,
    seek,
  }
}

export type MediaPlayback = ReturnType<typeof useMediaPlayback>
