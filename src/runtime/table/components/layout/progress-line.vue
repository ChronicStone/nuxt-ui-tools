<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'

/** A local refetch can finish in a few milliseconds; the line stays long enough to be seen. */
const MIN_VISIBLE_MS = 600

const props = defineProps<{
  active: boolean
  /** Changes on every refresh request, so the sweep restarts even while a request is running. */
  restartKey?: number
  barClass?: string
}>()

const visible = ref(props.active)
const sweep = ref(0)
let shownAt = Date.now()
let hideTimer: ReturnType<typeof setTimeout> | undefined

watch([() => props.active, () => props.restartKey], ([active, key], [wasActive, previousKey]) => {
  clearTimeout(hideTimer)
  if (active) {
    if (!wasActive || key !== previousKey) {
      sweep.value += 1
      shownAt = Date.now()
    }
    visible.value = true
    return
  }
  hideTimer = setTimeout(
    () => (visible.value = false),
    Math.max(0, MIN_VISIBLE_MS - (Date.now() - shownAt)),
  )
})

onBeforeUnmount(() => clearTimeout(hideTimer))
</script>

<template>
  <div
    class="nut-dl-progress pointer-events-none h-0.5 overflow-hidden"
    :data-active="visible"
    aria-hidden="true"
  >
    <span :key="sweep" class="nut-dl-progress__bar block h-full" :class="barClass" />
  </div>
</template>

<style>
.nut-dl-progress {
  opacity: 0;
  transition: opacity 0.24s ease-out;
}
.nut-dl-progress[data-active='true'] {
  opacity: 1;
  transition-duration: 0.12s;
}
.nut-dl-progress__bar {
  width: 34%;
  border-radius: 999px;
  background: var(--nut-dl-progress-color, var(--ui-primary));
  animation: nut-dl-progress-slide 0.8s cubic-bezier(0.65, 0, 0.35, 1) infinite paused;
}
.nut-dl-progress[data-active='true'] .nut-dl-progress__bar {
  animation-play-state: running;
}
@keyframes nut-dl-progress-slide {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(300%);
  }
}
@media (prefers-reduced-motion: reduce) {
  .nut-dl-progress__bar {
    width: 100%;
    animation: none;
  }
}
</style>
