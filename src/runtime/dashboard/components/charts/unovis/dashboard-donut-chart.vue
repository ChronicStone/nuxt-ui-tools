<script setup lang="ts">
import { Donut } from '@unovis/ts'
import VisDonut from '@unovis/vue/components/donut'
import VisSingleContainer from '@unovis/vue/containers/single-container'
import { usePreferredReducedMotion } from '@vueuse/core'
import { computed } from 'vue'

const props = defineProps<{
  segments: readonly { value: number; color: string }[]
  size: number
  thickness: number
  padAngle: number
  /** A click on a segment selects it. */
  selectable?: boolean
}>()
const emit = defineEmits<{ select: [index: number] }>()

const reducedMotion = usePreferredReducedMotion()
const duration = computed(() => (reducedMotion.value === 'reduce' ? 0 : 500))
const value = (segment: { value: number }) => segment.value
const color = (segment: { color: string }) => segment.color
// Segments are bound to arc data whose `index` is the position in `segments`.
const events = computed(() =>
  props.selectable
    ? {
        [Donut.selectors.segment]: {
          click: (arc: { index: number }) => emit('select', arc.index),
        },
      }
    : {},
)
</script>

<template>
  <div
    class="nut-dash-chart"
    :class="selectable && '[&_path]:cursor-pointer'"
    :style="{ height: `${size}px`, width: `${size}px` }"
  >
    <VisSingleContainer :data="props.segments" :height="size" :width="size" :duration="duration">
      <VisDonut
        :value="value"
        :color="color"
        :arc-width="thickness"
        :pad-angle="padAngle"
        :show-background="false"
        :events="events"
      />
    </VisSingleContainer>
  </div>
</template>
