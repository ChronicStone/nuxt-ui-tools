<script setup lang="ts">
import { computed } from 'vue'

/**
 * Progress ring: a track and a filled stroke, with content centered inside. `arc` opens the ring at
 * the bottom (a 240° gauge); `target` adds a tick across the stroke. Plain SVG, no chart library.
 */
const props = withDefaults(
  defineProps<{
    /** Filled share, `0`–`1`. Values outside are clamped. */
    ratio: number
    /** Outer size in pixels. */
    size?: number
    thickness?: number
    color?: string
    arc?: boolean
    /** Target share, `0`–`1`, drawn as a tick. */
    target?: number | null
  }>(),
  { arc: false, color: 'var(--nut-dash-s1)', size: 36, target: null, thickness: 3 },
)

const SWEEP_ARC = 240

function clamp(value: number) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0))
}

const geometry = computed(() => {
  const radius = (props.size - props.thickness) / 2
  const circumference = 2 * Math.PI * radius
  const sweep = props.arc ? SWEEP_ARC : 360
  // SVG angles start at 3 o'clock and run clockwise: a full ring starts at 12, an arc leaves its
  // gap centered at 6.
  const start = props.arc ? 90 + (360 - sweep) / 2 : -90
  const length = (circumference * sweep) / 360
  const center = props.size / 2
  return {
    center,
    circumference,
    filled: length * clamp(props.ratio),
    length,
    radius,
    start,
    tick: props.target === null ? null : tickAt(start + sweep * clamp(props.target)),
  }

  /** Short line across the stroke at `degrees`, overhanging it by a quarter of its width. */
  function tickAt(degrees: number) {
    const angle = (degrees * Math.PI) / 180
    const inner = radius - props.thickness * 0.75
    const outer = radius + props.thickness * 0.75
    return {
      x1: center + inner * Math.cos(angle),
      x2: center + outer * Math.cos(angle),
      y1: center + inner * Math.sin(angle),
      y2: center + outer * Math.sin(angle),
    }
  }
})
</script>

<template>
  <span
    class="relative grid shrink-0 place-items-center"
    :style="{ height: `${size}px`, width: `${size}px` }"
  >
    <svg
      class="absolute inset-0 overflow-visible"
      :viewBox="`0 0 ${size} ${size}`"
      aria-hidden="true"
      data-ring
    >
      <g :transform="`rotate(${geometry.start} ${geometry.center} ${geometry.center})`">
        <circle
          :cx="geometry.center"
          :cy="geometry.center"
          :r="geometry.radius"
          fill="none"
          stroke="var(--nut-dash-track)"
          :stroke-width="thickness"
          stroke-linecap="round"
          :stroke-dasharray="`${geometry.length} ${geometry.circumference}`"
        />
        <circle
          v-if="geometry.filled > 0"
          :cx="geometry.center"
          :cy="geometry.center"
          :r="geometry.radius"
          fill="none"
          :stroke="color"
          :stroke-width="thickness"
          stroke-linecap="round"
          :stroke-dasharray="`${geometry.filled} ${geometry.circumference}`"
          class="transition-[stroke-dasharray] duration-700 ease-out motion-reduce:transition-none"
        />
      </g>
      <line
        v-if="geometry.tick"
        v-bind="geometry.tick"
        stroke="var(--ui-text-highlighted)"
        stroke-width="2"
        stroke-linecap="round"
        data-ring-target
      />
    </svg>
    <span class="relative text-center"><slot /></span>
  </span>
</template>
