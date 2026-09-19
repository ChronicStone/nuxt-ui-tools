<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'

const MIN_THUMB = 28
const TRACK_INSET = 4

const props = defineProps<{ target: HTMLElement | null }>()

const hasVertical = ref(false)
const hasHorizontal = ref(false)
const verticalThumb = ref({ offset: 0, size: 0 })
const horizontalThumb = ref({ offset: 0, size: 0 })
const dragging = shallowRef<'vertical' | 'horizontal' | null>(null)
const hovered = ref(false)
const recentlyScrolled = ref(false)
const visible = computed(() => hovered.value || recentlyScrolled.value || dragging.value !== null)

let idleTimer: ReturnType<typeof setTimeout> | undefined
let frame = 0
let observer: ResizeObserver | undefined

function thumb(params: { offset: number; overflow: number; track: number }) {
  const track = Math.max(0, params.track - TRACK_INSET * 2)
  const ratio = params.track / (params.track + params.overflow)
  const size = Math.max(MIN_THUMB, Math.round(track * ratio))
  const travel = Math.max(0, track - size)
  const progress = params.overflow > 0 ? params.offset / params.overflow : 0
  return { offset: Math.round(TRACK_INSET + travel * progress), size }
}

function read() {
  frame = 0
  const el = props.target
  if (!el) {
    return
  }
  const overflowY = el.scrollHeight - el.clientHeight
  const overflowX = el.scrollWidth - el.clientWidth
  hasVertical.value = overflowY > 1
  hasHorizontal.value = overflowX > 1
  if (hasVertical.value) {
    verticalThumb.value = thumb({
      offset: el.scrollTop,
      overflow: overflowY,
      track: el.clientHeight,
    })
  }
  if (hasHorizontal.value) {
    horizontalThumb.value = thumb({
      offset: el.scrollLeft,
      overflow: overflowX,
      track: el.clientWidth,
    })
  }
  const host = el.parentElement
  if (!host) {
    return
  }
  host.classList.toggle('nut-dl-table--scrolled', el.scrollLeft > 2)
  host.classList.toggle('nut-dl-table--can-right', overflowX - el.scrollLeft > 2)
  host.classList.toggle('nut-dl-table--scrolled-y', el.scrollTop > 2)
}

function schedule() {
  if (frame) {
    return
  }
  frame = requestAnimationFrame(read)
}

function onScroll() {
  schedule()
  recentlyScrolled.value = true
  clearTimeout(idleTimer)
  idleTimer = setTimeout(() => (recentlyScrolled.value = false), 900)
}

function startDrag(axis: 'vertical' | 'horizontal', event: PointerEvent) {
  const el = props.target
  if (!el) {
    return
  }
  event.preventDefault()
  dragging.value = axis
  const vertical = axis === 'vertical'
  const start = vertical ? event.clientY : event.clientX
  const startScroll = vertical ? el.scrollTop : el.scrollLeft
  const track = vertical ? el.clientHeight : el.clientWidth
  const overflow = vertical ? el.scrollHeight - el.clientHeight : el.scrollWidth - el.clientWidth
  const size = vertical ? verticalThumb.value.size : horizontalThumb.value.size
  const travel = Math.max(1, track - TRACK_INSET * 2 - size)

  function onMove(move: PointerEvent) {
    const delta = (vertical ? move.clientY : move.clientX) - start
    const next = startScroll + (delta / travel) * overflow
    if (vertical) {
      el!.scrollTop = next
    } else {
      el!.scrollLeft = next
    }
  }
  function onUp() {
    dragging.value = null
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', onUp)
  }
  window.addEventListener('pointermove', onMove, { passive: true })
  window.addEventListener('pointerup', onUp)
  window.addEventListener('pointercancel', onUp)
}

function onEnter() {
  return (hovered.value = true)
}
function onLeave() {
  return (hovered.value = false)
}

function attach(el: HTMLElement | null) {
  observer?.disconnect()
  if (!el) {
    return
  }
  el.addEventListener('scroll', onScroll, { passive: true })
  el.addEventListener('pointerenter', onEnter)
  el.addEventListener('pointerleave', onLeave)
  observer = new ResizeObserver(schedule)
  observer.observe(el)
  for (const child of el.children) {
    observer.observe(child)
  }
  schedule()
}

function detach(el: HTMLElement | null) {
  el?.removeEventListener('scroll', onScroll)
  el?.removeEventListener('pointerenter', onEnter)
  el?.removeEventListener('pointerleave', onLeave)
  observer?.disconnect()
}

watch(
  () => props.target,
  (next, previous) => {
    detach(previous ?? null)
    attach(next ?? null)
  },
)
onMounted(() => attach(props.target))
onBeforeUnmount(() => {
  detach(props.target)
  clearTimeout(idleTimer)
  if (frame) {
    cancelAnimationFrame(frame)
  }
})

defineExpose({ measure: schedule })
</script>

<template>
  <div
    v-if="hasVertical"
    class="nut-dl-sb pointer-events-none absolute top-0.5 right-0.5 bottom-2 z-[6] w-1.5 opacity-0 transition-opacity duration-150 motion-reduce:transition-none"
    :class="{ 'pointer-events-auto opacity-100': visible }"
  >
    <span
      class="absolute top-0 left-0 w-full rounded-full bg-black/25 transition-colors duration-150 will-change-transform hover:bg-black/40 dark:bg-white/25 dark:hover:bg-white/40"
      :class="{ 'bg-black/45 dark:bg-white/45': dragging === 'vertical' }"
      :style="{
        height: `${verticalThumb.size}px`,
        transform: `translateY(${verticalThumb.offset}px)`,
      }"
      @pointerdown="startDrag('vertical', $event)"
    />
  </div>
  <div
    v-if="hasHorizontal"
    class="nut-dl-sb pointer-events-none absolute right-2 bottom-0.5 left-0.5 z-[6] h-1.5 opacity-0 transition-opacity duration-150 motion-reduce:transition-none"
    :class="{ 'pointer-events-auto opacity-100': visible }"
  >
    <span
      class="absolute top-0 left-0 h-full rounded-full bg-black/25 transition-colors duration-150 will-change-transform hover:bg-black/40 dark:bg-white/25 dark:hover:bg-white/40"
      :class="{ 'bg-black/45 dark:bg-white/45': dragging === 'horizontal' }"
      :style="{
        width: `${horizontalThumb.size}px`,
        transform: `translateX(${horizontalThumb.offset}px)`,
      }"
      @pointerdown="startDrag('horizontal', $event)"
    />
  </div>
</template>
